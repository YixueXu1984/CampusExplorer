import {InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";

export default class GetGeoLocation  {
    public res: object;

    constructor()  {
        this.res = {};
        // stub
    }

    public getGeoLocation(Location: string): Promise<number[]>  {
        let address = Location;
        let encodedAddress = encodeURI(address);

        return new Promise<number[]>((resolve, reject) => {
        const http = require("http");

        http.get("http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_l1k0b_q0t1b_v7e0b/" +
            encodedAddress, (res: any) => {
            const status = res.statusCode;

            let err;
            if (status !== 200) {
                err = new Error("Request Failed: " + status);
            }
            if (err) {
                res.resume();
                reject (new InsightError("Returned error: input is not a valid address"));
            }  else {
                res.setEncoding("utf8");
                let data = "";
                res.on("data", (chunk: any) => data += chunk);
                res.on("end", () => {
                    try {
                        let parsedData = JSON.parse(data);
                        let lat = parsedData.lat;
                        let lon = parsedData.lon;
                        let response = [lat, lon];
                        resolve(response);
                    } catch (err) {
                        reject (new InsightError("Error returning geolocation"));
                    }
                });
            }
            });
        });
    }

}
