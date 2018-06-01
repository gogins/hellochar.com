import * as classnames from "classnames";
import { parse } from "query-string";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { ISketch, SketchAudioContext, SketchConstructor } from "../sketch";
import { SketchComponent } from "../sketchComponent";
import { ShrinkingHeader } from "./shrinkingHeader";

export interface ISketchRouteProps {
    sketchClass: SketchConstructor;
}

export class FullPageSketch extends React.Component<ISketchRouteProps, {}> {
    public render() {
        const isPresentationMode = !!parse(location.search).presentationMode;
        const classes = classnames("full-page-sketch", { "presentation-mode": isPresentationMode });
        return (
            <div className={classes}>
                <SketchComponent sketchClass={this.props.sketchClass} />
            </div>
        );
    }
}
