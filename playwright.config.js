import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",workers:1,timeout:30000,
 use:{baseURL:"http://127.0.0.1:34170",viewport:{width:1440,height:960},headless:true,
 launchOptions:{executablePath:process.env.SESH_TEST_BROWSER || "C:/Program Files/Google/Chrome/Application/chrome.exe",args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]},
 screenshot:"only-on-failure",trace:"retain-on-failure"},
 webServer:{command:"node scripts/ui-test-server.js",url:"http://127.0.0.1:34170/api/health",reuseExistingServer:false,timeout:20000},
});
