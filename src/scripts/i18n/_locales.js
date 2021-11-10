"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const en_US_json_1 = __importDefault(require("./en-US.json"));
const zh_CN_json_1 = __importDefault(require("./zh-CN.json"));
const zh_TW_json_1 = __importDefault(require("./zh-TW.json"));
const ja_json_1 = __importDefault(require("./ja.json"));
const fr_FR_json_1 = __importDefault(require("./fr-FR.json"));
const de_json_1 = __importDefault(require("./de.json"));
const nl_json_1 = __importDefault(require("./nl.json"));
const es_json_1 = __importDefault(require("./es.json"));
const sv_json_1 = __importDefault(require("./sv.json"));
const tr_json_1 = __importDefault(require("./tr.json"));
const it_json_1 = __importDefault(require("./it.json"));
const uk_json_1 = __importDefault(require("./uk.json"));
const pt_BR_json_1 = __importDefault(require("./pt-BR.json"));
const fi_FI_json_1 = __importDefault(require("./fi-FI.json"));
const locales = {
    "en-US": en_US_json_1.default,
    "zh-CN": zh_CN_json_1.default,
    "zh-TW": zh_TW_json_1.default,
    "ja": ja_json_1.default,
    "fr-FR": fr_FR_json_1.default,
    "de": de_json_1.default,
    "nl": nl_json_1.default,
    "es": es_json_1.default,
    "sv": sv_json_1.default,
    "tr": tr_json_1.default,
    "it": it_json_1.default,
    "uk": uk_json_1.default,
    "pt-BR": pt_BR_json_1.default,
    "fi-FI": fi_FI_json_1.default,
};
exports.default = locales;
