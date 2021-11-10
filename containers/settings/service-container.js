"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const service_1 = require("../../components/settings/service");
const service_2 = require("../../scripts/models/service");
const app_1 = require("../../scripts/models/app");
const getService = (state) => state.service;
const mapStateToProps = (0, reselect_1.createSelector)([getService], service => ({
    configs: service,
}));
const mapDispatchToProps = (dispatch) => ({
    save: (configs) => dispatch((0, service_2.saveServiceConfigs)(configs)),
    remove: () => dispatch((0, service_2.removeService)()),
    blockActions: () => dispatch((0, app_1.saveSettings)()),
    sync: () => dispatch((0, service_2.syncWithService)()),
    authenticate: async (configs) => {
        const hooks = (0, service_2.getServiceHooksFromType)(configs.type);
        if (hooks.authenticate)
            return await hooks.authenticate(configs);
        else
            return true;
    },
    reauthenticate: async (configs) => {
        const hooks = (0, service_2.getServiceHooksFromType)(configs.type);
        try {
            if (hooks.reauthenticate)
                return await hooks.reauthenticate(configs);
        }
        catch (err) {
            console.log(err);
            return configs;
        }
    },
});
const ServiceTabContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(service_1.ServiceTab);
exports.default = ServiceTabContainer;
