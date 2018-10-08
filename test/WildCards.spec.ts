import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {expect} from "chai";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {ITestQuery} from "./InsightFacade.spec";

// describe("InsightFacade PerformQuery", () => {
//     const datasetsToQuery: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         courses3: "./test/data/courses3.zip",
//     };
//     let insightFacade: InsightFacade;
//     let testQueries: ITestQuery[] = [];
//
//     // Create a new instance of InsightFacade, read in the test queries from test/queries and
//     // add the datasets specified in datasetsToQuery.
//     before(async function () {
//         Log.test(`Before: ${this.test.parent.title}`);
//
//         // Load the query JSON files under test/queries.
//         // Fail if there is a problem reading ANY query.
//         try {
//             testQueries = await TestUtil.readTestQueries();
//             expect(testQueries).to.have.length.greaterThan(0);
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
//         }
//
//         try {
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error(err);
//         } finally {
//             expect(insightFacade).to.be.instanceOf(InsightFacade);
//         }
//
//         // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
//         // Fail if there is a problem reading ANY dataset.
//         try {
//             const loadDatasetPromises: Array<Promise<Buffer>> = [];
//             for (const [id, path] of Object.entries(datasetsToQuery)) {
//                 loadDatasetPromises.push(TestUtil.readFileAsync(path));
//             }
//             const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
//                 return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
//             });
//             expect(loadedDatasets).to.have.length.greaterThan(0);
//
//             const responsePromises: Array<Promise<string[]>> = [];
//             const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
//             for (const [id, content] of Object.entries(datasets)) {
//                 responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
//             }
//
//             // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
//             // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
//             // to run you queries.
//             try {
//                 const responses: string[][] = await Promise.all(responsePromises);
//                 responses.forEach((response) => expect(response).to.be.an("array"));
//             } catch (err) {
//                 Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
//             }
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
//         }
//     });
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     // Dynamically create and run a test for each query in testQueries
//     // it("Should run test queries", () => {
//     //     describe("Dynamic InsightFacade PerformQuery tests", () => {
//     //         for (const test of testQueries) {
//     //             it(`[${test.filename}] ${test.title}`, async () => {
//     //                 let response: any[];
//     //
//     //                 try {
//     //                     response = await insightFacade.performQuery(test.query);
//     //                 } catch (err) {
//     //                     response = err;
//     //                 } finally {
//     //                     if (test.isQueryValid) {
//     //                         expect(response).to.deep.equal(test.result);
//     //                     } else {
//     //                         expect(response).to.be.instanceOf(InsightError);
//     //                     }
//     //                 }
//     //             });
//     //         }
//     //     });
//     // });
//
//     it("", () => {
//     });
// });
