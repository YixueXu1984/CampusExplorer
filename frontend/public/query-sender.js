/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhttp = new XMLHttpRequest();
        xhttp.onload = () => {
            resolve(this.response);
        };
        xhttp.open("POST", "/query", true);
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(query));
    });
};
