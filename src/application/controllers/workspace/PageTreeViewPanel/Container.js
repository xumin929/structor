/*
 * Copyright 2015 Alexander Pustovalov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {forOwn} from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { modelSelector } from './selectors.js';
import { containerActions } from './actions.js';

import { graphApi } from '../../../api';

import { Button } from 'react-bootstrap';

import { PageTreeViewItem, PageTreeViewItemText } from '../../../views/index.js';

var scrollToSelected = function($frameWindow, key){
    setTimeout((function(_frameWindow){
        return function(){
            let $selected = _frameWindow.find('#' + key);
            if($selected && $selected.length > 0){
                var diff = ($selected.offset().top + _frameWindow.scrollTop()) - _frameWindow.offset().top;
                var margin = parseInt(_frameWindow.css("height"))/5;
                //_frameWindow[0].scrollTop = (diff - margin);
                //console.log("Scroll to " + (diff - margin));
                _frameWindow.animate(
                    { scrollTop: (diff - margin) },
                    300
                );
                diff = null;
                margin = null;
            }
            $selected = null;
        }
    })($frameWindow), 0);

};

class Container extends Component{

    constructor(props) {
        super(props);
        this.scrollToSelected = this.scrollToSelected.bind(this);
        //this.state = {};
        //this.handleChangeInlineText = this.handleChangeInlineText.bind(this);
    }

    componentDidMount() {
        this.$frameWindow = $(this.refs.panelElement);
        this.scrollToSelected();
    }

    componentDidUpdate(){
        this.scrollToSelected();
    }

    componentWillUnmount() {
        this.$frameWindow = undefined;
    }

    shouldComponentUpdate(nextProps, nextState){
        const { deskPageModel } = this.props;
        const { deskPageModel: newDeskPageModel } = nextProps;
        return (
            newDeskPageModel.reloadPageCounter !== deskPageModel.reloadPageCounter
            || newDeskPageModel.currentPagePath !== deskPageModel.currentPagePath
            || newDeskPageModel.markedUpdateCounter !== deskPageModel.markedUpdateCounter
            || newDeskPageModel.modelUpdateCounter !== deskPageModel.modelUpdateCounter
        );
    }

    scrollToSelected(){
        const { selectionBreadcrumbsModel: {selectedKeys} } = this.props;
        if(selectedKeys && selectedKeys.length > 0){
            scrollToSelected(this.$frameWindow, selectedKeys[selectedKeys.length - 1]);
        }
    }

    //handleChangeInlineText(textValue){
    //    this.props.rewriteModelNode({
    //        text: _.unescape(textValue)
    //    })
    //}

    buildNode(graphNode) {

        let inner = [];
        const modelNode = graphNode.modelNode;

        let innerProps = [];
        if(graphNode.props){
            forOwn(graphNode.props, (prop, propName) => {
                innerProps.push(this.buildNode(prop));
            });
        }
        let children = [];
        if(graphNode.children && graphNode.children.length > 0){
            graphNode.children.forEach(node => {
                children.push(this.buildNode(node));
            });
        } else if(modelNode.text) {
            inner.push(
                <PageTreeViewItemText
                    itemKey={graphNode.key}
                    key={'text' + graphNode.key}
                    textValue={modelNode.text} />
            )
        }

        if(innerProps.length > 0 || children.length > 0){
            inner.push(
                <ul id={graphNode.key}
                    key={'list' + graphNode.key}
                    className={graphNode.selected ? 'umy-treeview-list-selected' : 'umy-treeview-list'}>
                    {innerProps}
                    {children}
                </ul>
            );
        }

        return (
            <PageTreeViewItem
                key={'treeItem' + graphNode.key}
                itemKey={graphNode.key}
                isSelected={graphNode.selected}
                type={modelNode.type}
                modelProps={modelNode.props}
                onSelect={this.props.setSelectedKey}>
                {inner}
            </PageTreeViewItem>
        );
    }

    render() {

        const { deskPageModel, togglePageTreeview } = this.props;
        const pageGraph = graphApi.getWrappedModelByPagePath(deskPageModel.currentPagePath);

        let style = {
            padding: '2em 1em 1em 1em',
            height: '100%',
            overflow: 'auto',
            border: '1px solid #DBDBDB',
            borderRadius: '3px'
        };

        let listItems = [];
        if(pageGraph){
            pageGraph.children.forEach((child, index) => {
                listItems.push(this.buildNode(child));
            });
        }

        //let containerStyle = {
        //    position: 'absolute',
        //    left: '4em',
        //    right: '4em',
        //    top: '2px',
        //    zIndex: 1030
        //};
        //let overlay = (<div style={containerStyle}><OverlayButtonsControl /></div>);

        //
        return (
            <div ref="panelElement" style={style}>
                <Button bsSize='xsmall'
                        style={
                            {
                                padding: '0.2em',
                                position: 'absolute',
                                top: '2px',
                                left: '2px',
                                width: '2em',
                                height: '2em',
                                zIndex: '1030'
                            }
                        }
                        onClick={togglePageTreeview}>
                    <span className='fa fa-times fa-fw'></span>
                </Button>
                <ul className='umy-treeview-list' style={{border: 0}}>
                    {listItems}
                </ul>
            </div>
        );
    }

}

export default connect(modelSelector, containerActions)(Container);

