import { nodeType, nodeStatus, linkStatus } from "../utils";

import {sheetsNodeData, sheetsNodeDataSeattle} from '../constants/spreadsheet_endpoints';
// const sheetsNodeData = 'https://spreadsheets.google.com/feeds/cells/1FnKRPuEP2e1RIPwGmR1Ne153A_znaU3CzISDG52F-_Y/1/public/full?alt=json';
// const sheetsLinksData = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZky64G3ynxhwh5QXZ3JLTPFXZ6-XTJmgz96ocdDwsbVIYjIqb0QDL8hxRGyq_Sl22sXbPh1bmFJY9/pubhtml';
// const sheetsSectorData = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoIfkaY0NUUW6z4nIIVIwufpYMBR2lYzETKSdkLfiuHm34eokO7URgegOoX5tmIKmUvQMXcmH46qSV/pubhtml';
// const kioskData = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJUXClGCrv8AaD68M1hOgHB3p2si7fmpTM8-dPhbOpvd7l0M0I6zJ47YTdhgY4EoWtQHlIIv9FA2ln/pubhtml';

// check feed, and then entry inside json result. each entry in array should look like below:

//category: [{scheme: "http://schemas.google.com/spreadsheets/2006",…}]
// content: {type: "text", $t: "a"}
// gs$cell: {row: "1", col: "1", inputValue: "a", $t: "a"}
// id: {,…}
// link: [{rel: "self", type: "application/atom+xml",…}]
// title: {type: "text", $t: "A1"}
// $t: "A1"
// type: "text"
// updated: {$t: "2021-05-12T22:27:31.991Z"}

//parsed object should be:
// {
//     "id": 2,
//     "status": "Installed",
//     "coordinates": [
//       -73.99110519999999,
//       40.7123462,
//       74
//     ],
//     "requestDate": 1426436311615,
//     "installDate": 1513486800000,
//     "roofAccess": false,
//     "notes": "Peter",
//     "panoramas": [
//       "2.jpg"
//     ]
//   },


const initialFilters = {
	remote: true,
	linkNYC: false,
	potential: false,
	dead: false,
	"potential-hub": true,
	"potential-supernode": true,
	sector: true,
	backbone: false,
	changelog: false
};

async function populateSpreadsheet () {

	return fetch(sheetsNodeDataSeattle)
		.then(res => res.json())
		.then(json => json.feed.entry)
		.then(jsonEntries => {

			let rowMap = {
				1: "id",
				2: "name",
				3: "lng",
				4: "lat",
				5: "status",
				6: "notes"
			}

			let formattedEntry = {};
			let formattedEntries = [];


			for(var i = 0; i < jsonEntries.length; i++) {
				let entry = jsonEntries[i];
				let column = entry.gs$cell.col;
				let content = entry.content.$t;

				let newStatus = '';
				if(column == 5) {
					if(content == "confirmed" || content == "active") {
					  newStatus = "Installed";
					}
					if (content == "in-conversation") {
					  newStatus = "Interested";
					}

				  content = newStatus;
				}


				if(column == 3) {
					formattedEntry["coordinates"] = [parseFloat(content)];
				} else if (column == 4) {
					formattedEntry["coordinates"].unshift(parseFloat(content));
					formattedEntry["coordinates"].push(1);
				} else {
					formattedEntry[rowMap[column]] = content;
				}

				if(column == 6) {

					formattedEntry.requestDate = Date.now();
					formattedEntry.installDate = Date.now();

				    formattedEntries.push(formattedEntry);
					formattedEntry = {};
				}
			}
			return formattedEntries;
		})
		.catch(err => {
			console.log(err);
			return err;
		});

}


const reducerInit = async () => {
	const nodeData = await populateSpreadsheet();
	const { nodes, links, sectors, nodesById } = addGraphData(
		nodeData,
		[],
		[]
	);
	
	return (
		state = {
			nodes,
			links,
			sectors,
			kiosks: initialFilters.linkNYC === false ? [] : [],
			nodesById,
			filters: initialFilters,
			statusCounts: getCounts(nodeData, []),
			showFilters: false
		},
		action
	) => {
		switch (action.type) {
			case "TOGGLE_FILTER":
				const newFilters = {
					...state.filters,
					[action.label]:
						state.filters[action.label] === []
							? false
							: !state.filters[action.label]
				};
				if (action.label === "potential") {
					const hasValue = state.filters["potential"] === [];
					const newValue = hasValue ? false : !state.filters["potential"];
					newFilters["dead"] = newValue;
				}
				return {
					...state,
					filters: newFilters,
					kiosks: newFilters.linkNYC === false ? [] : []
				};
			case "TOGGLE_FILTERS":
				return {
					...state,
					showFilters: !state.showFilters
				};
	
			default:
				return state;
		}
	};

}


// TODO: Calculate a lot of this in node-db
function addGraphData(nodes, links, sectors) {
	const _remoteSheet = true;


	const nodesById = {};

	const linksByNodeId = {};

	// Group nodes at same lat / lng
	const mergedNodes = {};

	// Add status, types and links to nodes
	nodes.forEach(node => {
		if (node.notes) {
			node.notes = String(node.notes);
		}
		nodesById[node.id] = node;
		node.links = linksByNodeId[node.id];
		node.status = nodeStatus(node);
		const key = geoKey(node);
		mergedNodes[key] = mergedNodes[key] || [];
		mergedNodes[key].push(node);
	});


	// Add sectors to nodes
	const sectorsByNodeId = {};

	nodes.forEach(node => {
		node.sectors = sectorsByNodeId[node.id];

		// Calculate connected nodes for each active node
		const connectedNodes = [node.id];

		node.connectedNodes = connectedNodes;
		node.memberNodes = mergedNodes[geoKey(node)];

		node.type = nodeType(node);
		nodesById[node.id] = node;
	});

	return { nodes, links, sectors, nodesById };
}

function getCounts(nodes, kiosks) {
	const counts = {};
	nodes.forEach(node => {
		const { type } = node;
		counts[type] = (counts[type] || 0) + 1;

		if (node.sectors) {
			counts["sector"] = (counts["sector"] || 0) + node.sectors.length;
		}
	});
	counts.linkNYC = 0;
	return counts;
}

function geoKey(node) {
	const precision = 5;
	const [lat, lng] = node.coordinates;
	const key = lat.toFixed(precision) + "-" + lng.toFixed(precision);
	return key;
}

export default reducerInit;
