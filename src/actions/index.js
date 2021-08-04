
// calls to netlify are NYC--centric, can take out eventually.
export function fetchNodes(dispatch) {
	fetch("https://node-db.netlify.com/nodes.json")
		.then(res => res.json())
		.then(json => {
			dispatch({ type: "FETCH_NODES_SUCCESS", nodes: json });
		})
		.catch(err => console.log(err));
}

export function fetchLinks(dispatch) {
	fetch("https://node-db.netlify.com/links.json")
		.then(res => res.json())
		.then(json => {
			dispatch({ type: "FETCH_LINKS_SUCCESS", links: json });
		})
		.catch(err => console.log(err));
}

export function fetchKiosks(dispatch) {
	fetch("https://node-db.netlify.com/kiosks.json")
		.then(res => res.json())
		.then(json => {
			dispatch({ type: "FETCH_KIOSKS_SUCCESS", kiosks: json });
		})
		.catch(err => console.log(err));
}

export function toggleFilter(label, dispatch) {
	dispatch({ type: "TOGGLE_FILTER", label });
}

export function toggleFilters(dispatch) {
	dispatch({ type: "TOGGLE_FILTERS" });
}
