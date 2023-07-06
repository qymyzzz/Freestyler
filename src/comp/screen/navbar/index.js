import React, { createRef, useEffect, useRef, useState } from "react";

import {
	Flex,
	Heading,
	useColorMode,
	useDisclosure
} from "@chakra-ui/react";




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

	const { isOpen, onClose } = useDisclosure();
	const { colorMode, toggleColorMode } = useColorMode();

	const btnRef = useRef();
	const settingsRef = createRef();
	const aboutAppRef = createRef();

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

	const onPressAboutApp = () => {
		aboutAppRef.current && aboutAppRef.current.openModal();
	};

	const onPressSettings = () => {
		settingsRef.current && settingsRef.current.openModal();
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
