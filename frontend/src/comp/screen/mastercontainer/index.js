import React from "react";

import { connect } from "react-redux";

import Actions from "../../redux/action";
import Constants from "../../utils/Constants";

import SearchPlaceView from "../searchplaceview";

const { MasterDrawerMenuType, AppNotifKey } = Constants;

const MasterContainer = (props) => {

	const renderMasterContainer = () => {
		return <SearchPlaceView menuType={MasterDrawerMenuType.Search} />;
	};

	return renderMasterContainer();
};

const mapStateToProps = (state) => {
	return {
		userConfig: state.userConfig,
		userPref: state.userPref,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		setUserConfig: (userConfig) =>
			dispatch(Actions.setUserConfig(userConfig)),
		setUserPref: (userPref) => dispatch(Actions.setUserPref(userPref)),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(MasterContainer);
