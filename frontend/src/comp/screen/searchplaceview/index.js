import React, { useEffect, useRef, useState } from "react";

import {
	Box,
	Flex,
	Icon,
	IconButton,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Spacer,
	Text,
} from "@chakra-ui/react";

import { CloseIcon, Search2Icon } from "@chakra-ui/icons";

import { transliterate as tr } from 'transliteration';


import {
	AutoComplete,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

import { useTranslation } from 'react-i18next';

import { BsFillStarFill, BsStar } from "react-icons/bs";

import { MdLocationPin } from "react-icons/md";

import { connect } from "react-redux";

import * as geolib from "geolib";
import lodash from "lodash";

import MasterGlobeView from "../globeview";
import NavBarView from "../navbar";
import PlaceInfoView from "./placeInfo";

import Actions from "../../redux/action";
import AppManager from "../../utils/AppManager";
import Constants from "../../utils/Constants";

import MasterWorldArray from "../../data/info/countries+states+cities.json";

const { MasterDrawerMenuType, PlaceType, AppNotifKey } = Constants;

const SearchPlaceView = (props) => {
	const {
		userConfig,
		userPref,
		menuType = MasterDrawerMenuType.Search,
	} = props;

	const [state, setState] = useState({
		placeName: "",
		searchResultArray: [],
		placeItem: null,
		placeholder: "Searching...",
		isSearching: false,
		favPlaceArray: userPref?.favPlaceArray ?? [],
		isAppLoaded: false,
	});

	const { t } = useTranslation();

	const [searchKeyword, setSearchKeyword] = useState("");

	const updateState = (data) =>
		setState((preState) => ({ ...preState, ...data }));

	let searchTimer = useRef();

	/*  Life-cycles Methods */

	useEffect(() => {
		props.setUserConfig({
			...userConfig,
			selectedInputCoordinate: null,
			isPlaceVisible: null,
			selectedCountryCode: null,
			selectedPlaceCoordinate: null,
			selectedPlaceItem: null,
			cond: false,
		});
		addEventListener();
		setTimeout(async () => {
			await updateState({
				isAppLoaded: true,
			});
			await props.setUserConfig({
				...userConfig,
				selectedMenuType: menuType,
			});

			await props.setIsMasterAppLoading(false);
		}, 800);
		return () => {
			removeEventListener();
		};
	}, []);

	useEffect(() => {
		if(userConfig?.cond === true){
			updateState({
				placeItem: userConfig?.selectedPlaceItem,
				cond: false,
			});
		}
		else{
			let selectedCountryCode = userConfig?.selectedCountryCode;

			if (!lodash.isNil(selectedCountryCode)) {
				setCountryFromCountryCode(selectedCountryCode);
			}
		}
	}, [userConfig]);

	useEffect(() => {
		props.setUserConfig({
			...userConfig,
			selectedMenuType: menuType,
		});
	}, [menuType]);

	useEffect(() => {
		clearSearchTimer();
		updateState({
			placeholder: t('Searching'),
			isSearching: true,
		});
		searchTimer.current = setTimeout(() => {
			searchPlaceFromKeyword(searchKeyword);
		}, 500);
	}, [searchKeyword]);

	/*  Public Interface Methods */

	const addEventListener = () => {
		AppManager.getInstance().addEventListener(
			AppNotifKey.SHOW_FAV_PLACE,
			emitOnPressPlaceItem
		);
	};

	const removeEventListener = () => {
		AppManager.getInstance().removeEventListener(
			AppNotifKey.SHOW_FAV_PLACE,
			emitOnPressPlaceItem
		);
	};

	const emitOnPressPlaceItem = (favPlaceItem) => {
		onPressPlaceItem(favPlaceItem);
	};

	const closetSort = (array, keyword) => {
		return array.sort((a, b) => {
			if (
				a.name.toLowerCase().indexOf(keyword.toLowerCase()) >
				b.name.toLowerCase().indexOf(keyword.toLowerCase())
			) {
				return 1;
			} else if (
				a.name.toLowerCase().indexOf(keyword.toLowerCase()) <
				b.name.toLowerCase().indexOf(keyword.toLowerCase())
			) {
				return -1;
			} else {
				if (a.name > b.name) return 1;
				else return -1;
			}
		});
	};

	const setCountryFromCountryCode = async (countryCode) => {
		let filterCountryArray = MasterWorldArray.filter((item) => {
			return item.numeric_code
				.toLowerCase()
				.includes(countryCode.toString().toLowerCase());
		}).slice(0, 1);

		let nearByCityDistance = 2000;
		let nearByStateDistance = 80000;
		let nearByPlaceItem = null;
		let finalNearByPlaceItem = null;

		if (filterCountryArray.length > 0) {
			let selectedPlaceCoordinate = userConfig?.selectedPlaceCoordinate;

			let countryItem = filterCountryArray[0];
			let nearByPlaceArray = countryItem.states.filter((stateObj) => {
				return (
					stateObj.cities.filter((city) => {
						return (
							geolib.getDistance(selectedPlaceCoordinate, {
								latitude: city?.latitude ?? 0,
								longitude: city?.longitude ?? 0,
							}) <= nearByCityDistance
						);
					}).length > 0
				);
			});

			if (nearByPlaceArray.length > 0) {
				let nearByStateItem = nearByPlaceArray[0];
				finalNearByPlaceItem = {
					...nearByStateItem,
					...selectedPlaceCoordinate,
					type: PlaceType.State,
					countryItem: lodash.omit(countryItem, ["states"]),
					countryName: countryItem.name,
					address: `${nearByStateItem.name}, ${countryItem.name}`,
				};

				nearByPlaceItem = nearByStateItem.cities.filter((city) => {
					return (
						geolib.getDistance(selectedPlaceCoordinate, {
							latitude: city?.latitude ?? 0,
							longitude: city?.longitude ?? 0,
						}) <= nearByCityDistance
					);
				});

				if (nearByPlaceItem.length > 0) {
					nearByPlaceItem = nearByPlaceItem[0];

					finalNearByPlaceItem = {
						...nearByPlaceItem,
						...selectedPlaceCoordinate,
						type: PlaceType.City,
						countryItem: lodash.omit(countryItem, ["states"]),
						stateItem: lodash.omit(nearByStateItem, ["cities"]),
						stateName: nearByStateItem?.name,
						countryName: countryItem.name,
						address: `${nearByPlaceItem.name}, ${nearByStateItem.name}, ${countryItem.name}`,
					};
				}

				updateState({
					placeItem: finalNearByPlaceItem,
				});

				return;
			} else {
				nearByPlaceArray = countryItem.states.filter((stateObj) => {
					return (
						geolib.getDistance(selectedPlaceCoordinate, {
							latitude: stateObj?.latitude ?? 0,
							longitude: stateObj?.longitude ?? 0,
						}) <= nearByStateDistance
					);
				});

				if (nearByPlaceArray.length > 0) {
					let nearByStateItem = nearByPlaceArray[0];

					finalNearByPlaceItem = {
						...nearByStateItem,
						...selectedPlaceCoordinate,
						type: PlaceType.State,
						countryItem: lodash.omit(countryItem, ["states"]),
						countryName: countryItem.name,
						address: `${nearByStateItem.name}, ${countryItem.name}`,
					};

					updateState({
						placeItem: finalNearByPlaceItem,
					});

					return;
				}
			}

			countryItem = lodash.omit(countryItem, ["states"]);

			countryItem = {
				...countryItem,
				...selectedPlaceCoordinate,
				type: PlaceType.Country,
				address: `${countryItem.name}`,
			};

			updateState({
				placeItem: countryItem,
			});
		}

		await props.setUserConfig({
			...userConfig,
			selectedCountryCode: null,
			selectedPlaceCoordinate: null,
		});
	};

	const isSearchPlaceFromWithinSettings = (type) => {
		let appSettingObj = userPref?.appSettings ?? {};
		let searchPlaceFromArray = appSettingObj?.searchPlaceFrom ?? [
			PlaceType.Country,
			PlaceType.State,
			PlaceType.City,
		];

		return searchPlaceFromArray.includes(type);
	};

	const searchPlaceFromKeyword = async (placeName) => {

		const baseUrl = 'https://nominatim.openstreetmap.org/search?';
		const params = new URLSearchParams({
			format: 'json',
			q: placeName,
		});

		const url = baseUrl + params.toString();

		// Make the API request
		fetch(url, {
			headers: {
				'accept-language': 'en'
			}
		})
			.then(response => response.json())
			.then(data => {
			let isCountrySearchEnabled = isSearchPlaceFromWithinSettings(
				PlaceType.Country
			);
			let isStateSearchEnabled = isSearchPlaceFromWithinSettings(
				PlaceType.State
			);
			let isCitySearchEnabled = isSearchPlaceFromWithinSettings(
				PlaceType.City
			);
	
			let filterCountryArray = [],
				filterStateArray = [],
				filterCityArray = [];
	
			if (lodash.isString(placeName)) {
				placeName = placeName.trim();
			}
	
			if (
				!lodash.isString(placeName) ||
				(lodash.isString(placeName) && placeName.length === 0)
			) {
				updateState({
					searchResultArray: [],
				});
	
				return;
			}
	
			const maxResultCount = 1000;
	
			if (isCountrySearchEnabled) {
				filterCountryArray = MasterWorldArray.map((item) => {
					return lodash.omit(item, ["states"]);
				});
	
				filterCountryArray = filterCountryArray.filter((item) => {
					return item.name
						.toLowerCase()
						.includes(placeName.toLowerCase());
				});
	
				filterCountryArray = closetSort(filterCountryArray, placeName);
	
				filterCountryArray = filterCountryArray.map((item) => {
					return {
						...item,
						type: PlaceType.Country,
						address: `${item.name}`,
					};
				});
			}
	
			if (isStateSearchEnabled) {
				filterStateArray = MasterWorldArray.filter((item) => {
					return (
						(item?.states ?? []).filter((stateItem) => {
							return stateItem.name
								.toLowerCase()
								.includes(placeName.toLowerCase());
						}).length > 0
					);
				}).slice(0, maxResultCount);
	
				filterStateArray = filterStateArray
					.map((item) => {
						return item.states.map((stateItem) => {
							return {
								...stateItem,
								type: PlaceType.State,
								countryItem: lodash.omit(item, ["states"]),
								countryName: item.name,
							};
						});
					})
					.flat();
	
				filterStateArray = filterStateArray
					.filter((item) => {
						return item.name
							.toLowerCase()
							.includes(placeName.toLowerCase());
					})
					.slice(0, maxResultCount);
	
				filterStateArray = filterStateArray.map((item) => {
					return lodash.omit(item, ["cities"]);
				});
	
				filterStateArray = closetSort(filterStateArray, placeName);
	
				filterStateArray = filterStateArray.map((item) => {
					return {
						...item,
						address: `${item.name}, ${item.countryName}`,
					};
				});
			}
	
			if (isCitySearchEnabled) {
				filterCityArray = MasterWorldArray.filter((item) => {
					return (
						(item?.states ?? []).filter((stateItem) => {
							return (
								(stateItem?.cities ?? []).filter((cityItem) => {
									return cityItem.name
										.toLowerCase()
										.includes(placeName.toLowerCase());
								}).length > 0
							);
						}).length > 0
					);
				}).slice(0, maxResultCount);
	
				filterCityArray = filterCityArray
					.map((item) => {
						return (item?.states ?? []).map((stateItem) => {
							return (stateItem?.cities ?? []).map((cityItem) => {
								return {
									...cityItem,
									type: PlaceType.City,
									countryItem: lodash.omit(item, ["states"]),
									stateItem: lodash.omit(stateItem, ["cities"]),
									stateName: stateItem?.name,
									countryName: item.name,
								};
							});
						});
					})
					.flat(3);
	
				filterCityArray = filterCityArray
					.filter((item) => {
						return item?.name
							?.toLowerCase()
							.includes(placeName.toLowerCase());
					})
					.slice(0, maxResultCount);
	
				filterCityArray = closetSort(filterCityArray, placeName);
	
				filterCityArray = filterCityArray.map((item) => {
					return {
						...item,
						address: `${item.name}, ${item.stateName}, ${item.countryName}`,
					};
				});
			}

			let searchResultArray = [
				...filterCityArray,
				...filterStateArray,
				...filterCountryArray,
			];

			// Process the response data
			let natureWords = ["river", "mountain", "nature", "natural", "ocean", "sea", "lake", "water", "volcano", "wood"];

			if (data.length > 0) {
				for(let j = 0; j < data.length; j++) {
					let place = data[j];
					for(let i = 0; i < natureWords.length; i++){
						if(place.type.includes(natureWords[i]) || place.class.includes[natureWords[i]]){
							const wordsArray = tr(place.display_name.toString()).split(',');
							const name = wordsArray[0].trim();
							let item = {
								address: tr(place.display_name.toString()),
								name: name,
								type: place.type.toString(),
								class: place.class.toString(),
								latitude: place.lat.toString(),
								longitude: place.lon.toString(),
							};
							searchResultArray.push(item);
						}
					}
				}

			searchResultArray = closetSort(searchResultArray, placeName).slice(
				0,
				maxResultCount
			);
			
			updateState({
				isSearching: false,
				placeholder: searchResultArray.length > 0 ? "" : "No result found",
				searchResultArray: searchResultArray,
			});
			} else {
				console.log('No results found.');

				// Update state or perform further actions when no results are found
				updateState({
				  isSearching: false,
				  placeholder: "No result found",
				  searchResultArray: [],
				});
			}
		})
			.catch(error => {
			console.error('Error:', error);
			updateState({
				isSearching: false,
				placeholder: "Error occurred",
				searchResultArray: [],
			  });
		});
	};

	const clearSearchTimer = () => {
		searchTimer.current && clearTimeout(searchTimer.current);

		searchTimer.current = null;
	};

	/*  UI Events Methods   */

	const handleChange = (event) => {
		let placeName = event?.target?.value;
		setSearchKeyword(placeName);
	};

	const onPressPlaceItem = async (placeItem) => {
		await props.setUserConfig({
			...userConfig,
			selectedPlaceItem: placeItem,
			isPlaceVisible: true,
		});

		setSearchKeyword("");

		updateState({
			placeItem: placeItem,
			searchResultArray: [],
		});
	};

	const onPressMakeFavItem = async (isFavPlace, favPlaceIndex, placeItem) => {
		let favPlaceArray = userPref?.favPlaceArray ?? [];

		if (isFavPlace) {
			if (favPlaceIndex >= 0) {
				favPlaceArray.splice(favPlaceIndex, 1);

				await props.setUserPref({
					...userPref,
					favPlaceArray: favPlaceArray.slice(),
				});
			}
		} else {
			favPlaceArray.push(placeItem);

			await props.setUserPref({
				...userPref,
				favPlaceArray: favPlaceArray.slice(),
			});
		}
	};

	const onClickClearButton = () => {
		setSearchKeyword("");
		updateState({
			searchResultArray: [],
		});
	};

	/*  Server Request Methods  */

	/*  Server Response Methods  */

	/*  Server Response Handler Methods  */

	/*  Custom-Component sub-render Methods */

	const renderSearchResultList = () => {
		
		return (
			<Flex
				flex={1}
				bg={"chakra-body-bg"}
			>
				<AutoComplete
					onSelectOption={(params) => {
						onPressPlaceItem(params?.item?.originalValue);
					}}
					suggestWhenEmpty={false}
					emptyState={
						<Flex
							flexDirection={"row"}
							alignItems={"center"}
							justifyContent={"center"}
						>
							{state?.isSearching && (
								<Icon
									as={Search2Icon}
									boxSize={"15px"}
									me={2}
								/>
							)}
							<Text
								fontSize="md"
								align={"center"}
							>
								{`${state?.placeholder}`}
							</Text>
						</Flex>
					}
				>
					<InputGroup
						bg={"chakra-body-bg"}
						size="md"
					>
						<InputLeftElement
							pointerEvents="none"
							color="gray.300"
							fontSize="1.2em"
							children={
								<Icon
									as={MdLocationPin}
									boxSize={"20px"}
								/>
							}
						/>
						<AutoCompleteInput
							variant="filled"
							placeholder={t('Enter_place_name')}
							value={searchKeyword}
							onChange={handleChange}
						/>
						<InputRightElement
							children={
								<IconButton
									onClick={onClickClearButton}
									alignSelf={"center"}
									variant="solid"
									borderStartRadius={0}
									icon={
										<Icon
											alignSelf={"center"}
											as={CloseIcon}
											boxSize={"15px"}
										/>
									}
								/>
							}
						/>
					</InputGroup>
					<AutoCompleteList
						paddingY={3}
						marginTop={"2px"}
					>
						{state.searchResultArray.map((item, index) => {
							
							let favPlaceArray = userPref?.favPlaceArray ?? [];
							favPlaceArray = favPlaceArray.map(
								(favPlaceItem) => favPlaceItem?.address
							);
							let isFavPlace = favPlaceArray.includes(
								item?.address
							);
							let favPlaceIndex = -1;
							if (isFavPlace) {
								favPlaceIndex = favPlaceArray.findIndex(
									(favPlaceAddress) =>
										favPlaceAddress === item?.address
								);
							}
					
							return (
								<AutoCompleteItem
									onClick={() => {
										onPressPlaceItem(item);
									}}
									key={`option-${index}`}
									fixed
									// getValue={(item) => "(issyk lake) " + item?.address}
									value= {item}
								>
									<Flex
										flexDirection={"column"}
										flex={1}
									>
										<Flex
											flexDirection={"row"}
											justifyContent={"center"}
											alignItems={"center"}
										>
											<Icon
												justifySelf={"center"}
												alignSelf={"center"}
												as={MdLocationPin}
												boxSize={"15px"}
												me={3}
											/>
											<Text fontSize="md">{`${item?.address}`}</Text>
											<Spacer />
											<IconButton
												variant={"solid"}
												onClick={() => {
													onPressMakeFavItem(
														isFavPlace,
														favPlaceIndex,
														item
													);
												}}
												icon={
													<Icon
														alignSelf={"center"}
														as={
															isFavPlace
																? BsFillStarFill
																: BsStar
														}
														boxSize={"15px"}
													/>
												}
											/>
										</Flex>
									</Flex>
								</AutoCompleteItem>
							);
						})}
					</AutoCompleteList>
				</AutoComplete>
			</Flex>
		);
	};

	const renderMasterContainer = () => {
		return (
			<Flex
				flex={1}
				direction={"column"}
				visibility={state?.isAppLoaded ? "visible" : "hidden"}
			>
				<NavBarView />
				<Flex
					flex={1}
					flexDirection={"row"}
				>
					<Flex
						flex={1}
						pointerEvents={"auto"}
						pt={3}
						ps={3}
						pe={3}
						flexDirection={"column"}
						bg={"#000"}
					>
						<Box
							borderRadius={"5px"}
							overflow={"hidden"}
							bg={"chakra-body-bg"}
						>
							{renderSearchResultList()}
						</Box>
						<Flex>
							<PlaceInfoView
								isPlaceVisible={userConfig?.isPlaceVisible}
								selectedPlaceCoordinate={
									userConfig?.selectedPlaceCoordinate
								}
								placeItem={state?.placeItem}
							/>
						</Flex>
					</Flex>
					<Flex
						flex={1.5}
						overflow={"visible"}
					>
						{state?.isAppLoaded && <MasterGlobeView />}
					</Flex>
				</Flex>
			</Flex>
		);
	};

	return renderMasterContainer();
};

const mapStateToProps = (state) => {
	return {
		userConfig: state.userConfig,
		userPref: state.userPref,
		isMasterAppLoading: state.isMasterAppLoading,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		setUserConfig: (userConfig) =>
			dispatch(Actions.setUserConfig(userConfig)),
		setUserPref: (userPref) => dispatch(Actions.setUserPref(userPref)),
		setIsMasterAppLoading: (isMasterAppLoading) =>
			dispatch(Actions.setIsMasterAppLoading(isMasterAppLoading)),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchPlaceView);
