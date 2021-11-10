"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceGroup = void 0;
class SourceGroup {
    constructor(sids, name = null) {
        name = (name && name.trim()) || "Source group";
        if (sids.length == 1) {
            this.isMultiple = false;
        }
        else {
            this.isMultiple = true;
            this.name = name;
            this.expanded = true;
        }
        this.sids = sids;
    }
}
exports.SourceGroup = SourceGroup;
