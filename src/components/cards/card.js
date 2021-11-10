"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const utils_1 = require("../../scripts/utils");
var Card;
(function (Card) {
    const openInBrowser = (props, e) => {
        props.markRead(props.item);
        window.utils.openExternal(props.item.link, (0, utils_1.platformCtrl)(e));
    };
    Card.bindEventsToProps = (props) => ({
        onClick: (e) => onClick(props, e),
        onMouseUp: (e) => onMouseUp(props, e),
        onKeyDown: (e) => onKeyDown(props, e),
    });
    const onClick = (props, e) => {
        e.preventDefault();
        e.stopPropagation();
        switch (props.source.openTarget) {
            case 2 /* External */: {
                openInBrowser(props, e);
                break;
            }
            default: {
                props.markRead(props.item);
                props.showItem(props.feedId, props.item);
                break;
            }
        }
    };
    const onMouseUp = (props, e) => {
        e.preventDefault();
        e.stopPropagation();
        switch (e.button) {
            case 1:
                openInBrowser(props, e);
                break;
            case 2:
                props.contextMenu(props.feedId, props.item, e);
        }
    };
    const onKeyDown = (props, e) => {
        props.shortcuts(props.item, e.nativeEvent);
    };
})(Card = exports.Card || (exports.Card = {}));
