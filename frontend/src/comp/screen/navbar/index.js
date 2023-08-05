import React, { useEffect, useState } from "react";

import {
	Flex,
	Heading
} from "@chakra-ui/react";

import i18n from 'i18next';


import { connect } from "react-redux";

import Actions from "../../redux/action";
import Constants from "../../utils/Constants";
import iconFile from "./freestyler icon.png";

const { MasterDrawerMenuType, MasterDrawerMenuConfig } = Constants;

const NavBarView = (props) => {
	const { userConfig } = props;

	const [state, setState] = useState({
		selectedMenuType:
			userConfig?.selectedMenuType ?? MasterDrawerMenuType.Search,
	});

	const updateState = (data) =>
		setState((preState) => ({ ...preState, ...data }));

	/*  Life-cycles Methods */

	useEffect(() => {
		return () => {};
	}, []);

	useEffect(() => {
		updateState({
			selectedMenuType:
				userConfig?.selectedMenuType ?? MasterDrawerMenuType.Search,
		});
	}, [userConfig]);

	/*  Public Interface Methods */

	/*  UI Events Methods   */

	const handleRussian = () => {
		i18n.changeLanguage('ru');
	};

	const handleEnglish = () => {
		i18n.changeLanguage('en');
	};

	/*  Server Request Methods  */

	/*  Server Response Methods  */

	/*  Server Response Handler Methods  */

	/*  Custom-Component sub-render Methods */

	const renderMasterContainer = () => {
		return (
			<>
				<Flex
					flexDirection={"row"}
					justifyContent={"space-between"}
					alignItems={"center"}
					boxShadow="md"
					p={"10px"}
					zIndex={10}
				>
					<Flex
						flexDirection={"row"}
						justifyContent="flex-start"
						alignItems="center"
						paddingY={1}
					>
						<img
							src={iconFile}
							alt="Icon"
							width={25}
							height={25}
						/>

						<Flex
							flexDirection={"row"}
							alignItems="center"
							justifyContent="center"
						>
							<Heading
								ms={"10px"}
								size={"md"}
							>
								{
									"Freestyler"
								}
							</Heading>
						</Flex>
					</Flex>
					{/* <Flex>
						<button onClick={handleRussian}>Russian</button>
						<button onClick={handleEnglish}>English</button>
					</Flex> */}
				</Flex>
			</>
		);
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

export default connect(mapStateToProps, mapDispatchToProps)(NavBarView);
