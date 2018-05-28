import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Link, NavLink } from "react-router-dom";
import { ISketch } from "../sketch";
import {withRouter} from 'react-router';

export class HomePage extends React.Component<RouteComponentProps<void>, {}> {
    public render() {
        return (
            <div className="homepage">
                { /* this.renderHighlight("Flame", "/assets/images/flame.png") */ }
                { this.props.history.push('/flame') }
            </div>
        );
    }

    public componentDidMount() {
        const hash = this.props.location.hash;
        const element = document.getElementById(hash);
        if (element != null) {
            element.scrollIntoView();
        }
    }

    private renderHighlight(name: string, imageUrl: string) {
        const linkUrl = `/${name.toLowerCase()}`;
        return (
            <figure className="work-highlight">
                <figcaption>
                    <Link className="work-highlight-name" to={linkUrl}>{name}</Link>
                </figcaption>
                <Link to={linkUrl}><img className="full-width" src={imageUrl} /></Link>
            </figure>
        );
    }
}
