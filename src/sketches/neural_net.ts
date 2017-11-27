import { ISketch } from "../sketch";

interface Sample {
    input: number[];
    output: number;
}

const trainingData = [
    { input: [0, 0], output: 0 },
    { input: [0, 1], output: 1 },
    { input: [1, 0], output: 1 },
    { input: [1, 1], output: 0 },
];

interface Edge {
    weight: number;
    source: Neuron;
    destination: Neuron;
}

class Neuron {
    /**
     * Edges where edge.source === this
     */
    private forwardEdges: Edge[] = [];
    /**
     * Edges where edge.destination === this
     */
    private backwardEdges: Edge[] = [];

    /**
     * This should actually be a computed value from all the backward edges (or if it's a root node, from the input itself)
     * Lets see how it pans out.
     */
    public value: number;

    public constructor() {}

    /**
     * Connect this neuron as the source to the destination.
     *
     * @param destination
     * @param weight
     */
    public connectTo(destination: Neuron, weight = randomWeight()) {
        const edge: Edge = {
            destination,
            source: this,
            weight,
        };
        this.forwardEdges.push(edge);
        destination.backwardEdges.push(edge);
    }

    public getForwardEdges() {
        return this.forwardEdges;
    }

    public getBackwardEdges() {
        return this.backwardEdges;
    }

    public setValueFromSources() {
        // iterate through the sources, multiply their value by the edge weights,
        // sum them together, then put them through the logistic function
        const inputSum = this.backwardEdges.reduce(
            (sum, edge) => sum + edge.source.value * edge.weight,
            0,
        );
        const logisticValue = 1 / (1 + Math.exp(-inputSum));
        this.value = logisticValue;
        return logisticValue;
    }
}

function randomWeight() {
    return Math.random();
}

const input1 = new Neuron();
const input2 = new Neuron();

const hiddenLayer = new Array(5).fill(undefined).map(() => new Neuron());

const output = new Neuron();

hiddenLayer.forEach((hidden) => {
    input1.connectTo(hidden);
    input2.connectTo(hidden);

    hidden.connectTo(output);
});

// ok, now run it to get the estimate
// first set the inputs
input1.value = trainingData[0].input[0];
input2.value = trainingData[0].input[1];

// now compute the value for each hidden layer node

hiddenLayer.forEach((neuron) => {
    // precondition: the values for all edges going into this one have been updated
    neuron.setValueFromSources();
});

// ok, we now have the output.
output.setValueFromSources();

// now do backpropogation - compare the net's output to the actual.
// use the difference to then feedback the output -> hidden layer edges and the hidden layer -> input edges

const netValue = output.value;
const trainingValue = trainingData[0].output;

const diff = Math.abs(trainingValue - netValue);

function init() {

}

function animate() {

}

export const NeuralNet: ISketch = {
    id: "nn",
    init,
    animate,
};
