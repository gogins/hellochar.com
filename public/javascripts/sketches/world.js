(function() {

    var TerrainGen = (function() {
        function fract( n ) {
            return n - Math.floor(n);
        }

        function hash( n ) {
            return fract(Math.sin(n)*43758.5453123);
        }

        function mix(a, b, x) {
            return Math.lerp(a, b, x);
        }

        // x = Vector3
        function noise( x ) {
            var p = x.clone().floor();
            var f = x.clone().sub(p);

            var f = f.clone().multiply(f).multiply(f.clone().multiplyScalar(-2.0).addScalar(3.0));

            var n = p.x + p.y*57.0 + 113.0*p.z;

            var res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                              mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                          mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                              mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
            return res;
        }

        // x = Vector3
        // returns [scalar, Vector3 corresponding to offset]
        function noised( x ) {
            var p = x.clone().floor();
            var f = x.clone().sub(p);

            var u = f.clone().multiply(f).multiply(f.clone().multiplyScalar(-2.0).addScalar(3.0));

            var n = p.x + p.y*57.0 + p.z*113.0;

            var a = hash(n + 0.0);
            var b = hash(n + 1.0);
            var c = hash(n + 57.0);
            var d = hash(n + 58.0);
            var e = hash(n + 113.0);
            var g = hash(n + 114.0);

            var scalar = a+(b-a+e)*u.x+(c-a+g)*u.y+(d-a-b)*u.z+(a-b-c-g+d+e)*u.x*u.y*u.z;

            var offset = f.clone();
            offset.multiply(f);
            offset.multiply(f.clone().multiply(f.clone().addScalar(-2)).addScalar(1.0));
            offset.multiply(new THREE.Vector3(b-a+e, c-a+g, d-a-b).add(new THREE.Vector3(u.z, u.y, u.x).multiplyScalar(a-b-c-g+d+e)));
            offset.multiplyScalar(30);
            return [scalar, offset];
        }

        var positionTransform = new THREE.Matrix4().makeRotationX(36).multiply(
                                new THREE.Matrix4().makeRotationY(36)).multiply(
                                new THREE.Matrix4().makeRotationZ(-36)).multiply(
                                new THREE.Matrix4().makeScale(2, 2, 2));
        // x = Vector3
        function terrain( x ) {
            var p = x.clone().multiplyScalar(0.03);
            var a = 0.0;
            var b = 1.0;
            var d = new THREE.Vector3(0, 0, 0);
            for(var i = 0; i < 5; i++) {
                var retVal = noised(p);
                var scalar = retVal[0];
                var n = retVal[1];
                d.add(n);
                a += b*scalar/(1.0+d.lengthSq());
                b *= 0.5;
                p.applyMatrix4(positionTransform);
            }

            return 140.0*a;
        }

        return {
            noise: noise,
            noised: noised,
            terrain: terrain
        };
    })();

    var scene, camera, controls, renderer;

    var worldMesh;

    function init(_renderer, _audioContext) {
        renderer = _renderer;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, _renderer.domElement.width / _renderer.domElement.height, 1, 120000);
        camera.position.set(0, 0, 50000);

        controls = new THREE.OrbitControls(camera);
        controls.damping = 0.2;

        var geometry = new THREE.BoxGeometry(2, 2, 2, 100, 100, 100);
        geometry.vertices.forEach(function (vertex) {
            vertex.normalize();
            var noise = TerrainGen.terrain(vertex.clone().multiplyScalar(100));
            // var noisedRet = TerrainGen.noised(vertex.clone().multiplyScalar(100));
            // var scalar = noisedRet[0];
            // var offset = noisedRet[1];
            vertex.normalize().multiplyScalar(20000 + 10 * noise);
        });
        geometry.computeFaceNormals();
        var material = new THREE.MeshLambertMaterial({
            color: 0xbbbbbb,
            ambient: 0x222222,
            shading: THREE.FlatShading
        });

        worldMesh = new THREE.Mesh(geometry, material);
        scene.add(worldMesh);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        scene.add(directionalLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, -1, 1);
        scene.add(directionalLight);

        var ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);


        window.camera = camera;
        window.renderer = renderer;
        window.scene = scene;
    }

    function animate(timeStep) {
        // camera.position.set(50000 * Math.cos(Date.now() / 1000), 50000 * Math.sin(Date.now() / 1000), 50000);
        controls.update();
        camera.lookAt(new THREE.Vector3());
        renderer.render(scene, camera);
    }

    var sketch = {
        id: "world",
        init: init,
        animate: animate
    };
    initializeSketch(sketch);
})();
