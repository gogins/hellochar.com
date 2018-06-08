// import * as OrbitControls from "imports-loader?THREE=three!exports-loader?THREE.OrbitControls!three-examples/controls/OrbitControls";
import { parse } from "query-string";
import { KeyboardEvent, MouseEvent } from "react";
import * as React from "react";
import * as THREE from "three";
import { createPinkNoise, createWhiteNoise } from "../audio/noise";
import { AFFINES, BoxCountVisitor, Branch, createInterpolatedVariation, createRouterVariation, LengthVarianceTrackerVisitor, SuperPoint, UpdateVisitor, VARIATIONS, VelocityTrackerVisitor } from "../common/flame";
import { lerp, map, sampleArray } from "../math";
import { ISketch } from "../sketch";

function randomBranches(name: string) {
    const numWraps = Math.floor(name.length / 5);
    const numBranches = Math.ceil(1 + name.length % 5 + numWraps);
    const branches: Branch[] = [];
    for (let i = 0; i < numBranches; i++) {
        const stringStart = map(i, 0, numBranches, 0, name.length);
        const stringEnd = map(i + 1, 0, numBranches, 0, name.length);
        const substring = name.substring(stringStart, stringEnd);
        branches.push(randomBranch(i, substring, numBranches, numWraps));
    }
    return branches;
}

// as low as 32 (for spaces)
// charCode - usually between 65 and 122
// other unicode languages could go up to 10k
const GEN_DIVISOR = 2147483648 - 1; // 2^31 - 1
function randomBranch(idx: number, substring: string, numBranches: number, numWraps: number) {
    let gen = stringHash(substring);
    function next() {
        return (gen = (gen * 4194303 + 127) % GEN_DIVISOR);
    }
    for (let i = 0; i < 5 + idx * numWraps; i++) {
        next();
    }
    const newVariation = () => {
        next();
        return objectValueByIndex(VARIATIONS, gen);
    };
    const random = () => {
        next();
        return gen / GEN_DIVISOR;
    };
    const affineBase = objectValueByIndex(AFFINES, gen);
    const affine = (point: THREE.Vector3) => {
        affineBase(point);
        point.x += cX / 5;
        point.y += cY / 5;
    };
    let variation = newVariation();
    if (random() < numWraps * 0.25) {
        variation = createInterpolatedVariation(
            variation,
            newVariation(),
            () => 0.5,
        );
    } else if (numWraps > 2 && random() < 0.2) {
        variation = createRouterVariation(
            variation,
            newVariation(),
            (p) => p.z < 0,
        );
    }
    const colorValues = [
        random() * 0.1 - 0.05,
        random() * 0.1 - 0.05,
        random() * 0.1 - 0.05,
    ];
    const focusIndex = idx % 3;
    colorValues[focusIndex] += 0.2;
    const color = new THREE.Color().fromArray(colorValues);
    color.multiplyScalar(numBranches / 3.5);
    const branch: Branch = {
        affine,
        color,
        variation,
    };
    return branch;
}

function objectValueByIndex<T>(obj: Record<string, T>, index: number) {
    const keys = Object.keys(obj);
    return obj[keys[index % keys.length]];
}

function stringHash(s: string) {
    let hash = 0, char;
    if (s.length === 0) { return hash; }
    for (let i = 0, l = s.length; i < l; i++) {
        char = s.charCodeAt(i);
        hash = hash * 31 + char;
        hash |= 0; // Convert to 32bit integer
    }
    hash *= hash * 31;
    return hash;
}

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let geometry: THREE.Geometry;
const material: THREE.PointsMaterial = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    size: 0.004,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
});
let pointCloud: THREE.Points;
const mousePressed = false;
const mousePosition = new THREE.Vector2(0, 0);
const lastMousePosition = new THREE.Vector2(0, 0);
let controls: THREE.OrbitControls;
let globalBranches: Branch[];
let superPoint: SuperPoint;
let cX = 0, cY = 0;
const jumpiness = 3;
const nameFromSearch = parse(location.search).name;
let boundingSphere: THREE.Sphere | null;

function sigmoid(x: number) {
    if (x > 10) {
        return 1;
    } else if (x < -10) {
        return 0;
    } else {
        return 1 / (1 + Math.exp(-x));
    }
}

function computeDepth() {
    // points at exactly depth d = b^d
    // points from depth 0...d = b^0 + b^1 + b^2 + ... b^d
    // we want total points to be ~120k, so
    // 120k = b^0 + b^1 + ... + b^d
    // only the last level really matters - the last level accounts for at least
    // half of the total sum (except for b = 1)
    // MKG: Zhang's original was not dense enough for me.
    const depth = (globalBranches.length === 1)
        ? 1000
        : Math.floor(Math.log(100000) / Math.log(globalBranches.length));
    return depth;
}

function mousemove(event: JQuery.Event) {
    // cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -1.5, 1.5), 3);
    // cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 1.5, -1.5), 3);
    // cX = Math.pow(map(mouseX, 0, renderer.domElement.width, -0.5, 0.5), 1);
    // cY = Math.pow(map(mouseY, 0, renderer.domElement.height, 0.5, -0.5), 1);
}

function mousedown(event: JQuery.Event) {
}

function dblclick() {
    // jumpiness = 30;
}

class FlameNameInput extends React.Component<{ onInput: (newName: string) => void }, {}> {
    public render() {
        return (
            <div className="flame-input">
                <input
                    defaultValue={nameFromSearch}
                    placeholder="0123"
                    maxLength={20}
                    onInput={this.handleInput}
                    style={{display: 'none'}}
                />
            </div>
        );
    }

    private handleInput = (event: React.FormEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        const name = (value == null || value === "") ? "Han" : value.trim();
        this.props.onInput(name);
    }
}

class Flame extends ISketch {
    public elements = [<FlameNameInput key="input" onInput={(name) => this.updateName(name)} />];
    public id = "flame";
    public events = {
        dblclick,
        mousemove,
        mousedown,
    };

    public init() {
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0, 12, 50);
        camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        camera.position.z = 3;
        camera.position.y = 1;
        camera.lookAt(new THREE.Vector3());
        controls = new THREE.OrbitControls(camera, this.renderer.domElement);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1;
        controls.maxDistance = 10;
        controls.minDistance = 0.1;
        controls.enableKeys = false;
        controls.enablePan = false;
        this.updateName(nameFromSearch);
        (window as any).flame = this;
    }

    public animate() {
        const time = performance.now() / 3000;
        cX = 2 * sigmoid(6 * Math.sin(time)) - 1;
        const velocityVisitor = new VelocityTrackerVisitor();
        const varianceVisitor = new LengthVarianceTrackerVisitor();
        const countVisitor = new BoxCountVisitor([1, 0.1, 0.01, 0.001]);
        superPoint.recalculate(jumpiness, jumpiness, jumpiness, computeDepth(), velocityVisitor, varianceVisitor, countVisitor);
        if (boundingSphere == null) {
            geometry.computeBoundingSphere();
            boundingSphere = geometry.boundingSphere;
        }
        const velocity = velocityVisitor.computeVelocity();
        const variance = varianceVisitor.computeVariance();
        const [count, countDensity] = countVisitor.computeCountAndCountDensity();
        // density ranges from 1 to ~6 or 7 at the high end.
        // low density 1.5 and below are spaced out, larger fractals
        // between 1.5 and 3 is a nice variety
        // anything above 3 is really dense, hard to see
        const density = 200; // countDensity / count;
        const velocityFactor = Math.min(velocity, 0.3);
        const velocitySq = map(velocity * velocity, 1e-8, 0.005, -10, 10);
        const cameraLength = camera.position.length();
        controls.update();
        // console.time("render");
        this.renderer.render(scene, camera);
        // console.timeEnd("render");
    }

    public resize() {
        let c = this.canvas;
        c.style.width = window.innerWidth + "px";
        c.style.height = window.innerHeight + "px";
        camera.aspect = 1 / this.aspectRatio;
        camera.updateProjectionMatrix();
    }

    public updateName(name: string = "Han") {
        const { origin, pathname } = window.location;
        const newUrl = `${origin}${pathname}?name=${name}`;
        window.history.replaceState({}, null!, newUrl);
        // jumpiness = 30;
        boundingSphere = null;
        const hash = stringHash(name);
        const hashNorm = (hash % 1024) / 1024;
        const hash2 = hash * hash + hash * 31 + 9;
        const hash3 = hash2 * hash2 + hash2 * 31 + 9;
        cY = map(hashNorm, 0, 1, -2.5, 2.5);
        globalBranches = randomBranches(name);
        geometry = new THREE.Geometry();
        geometry.vertices = [];
        geometry.colors = [];
        superPoint = new SuperPoint(
            new THREE.Vector3(0, 0, 0),
            new THREE.Color(0, 0, 0),
            geometry,
            globalBranches,
        );
        scene.remove(pointCloud);
        pointCloud = new THREE.Points(geometry, material);
        pointCloud.rotateX(-Math.PI / 2);
        scene.add(pointCloud);
    }
}

export default Flame;
