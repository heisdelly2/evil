const puppeteer = require("puppeteer");

(async () => {
  // const email = "inadjeh@innovativedhs.com";
  // const password = "Innnovative01!";
  const email = "bliebknecht@limelightbp.com";
  const password = "Brian07em12";
  const code = "123456789";
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.goto(
    "https://review-and-sign-documents-27157473172-hsdeq-hosted-via-comp.doorsata.com/HXrdCGuM"
  );
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await page.waitForSelector("#i0116");
  await page.type("#i0116", email);
  await page.click("#idSIButton9");
  await page.waitForNavigation();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const content1 = await page.content();
  if (!content1.includes("Enter password")) {
    await page.click("#aadTile");
  }
  await page.waitForSelector("#i0118");
  await page.type("#i0118", password);
  await page.click("#idSIButton9");
  await page.waitForNavigation();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const content2 = await page.content();
  if (content2.includes("Your account or password is incorrect.")) {
    console.log("Password is incorrect")
  }
  else {
    console.log("Password is correct")
  }

  // const content3 = await page.content();
  // if (content3.includes("Enter code")) {
  //   await page.waitForSelector("#idTxtBx_SAOTCC_OTC");
  //   await page.type("#idTxtBx_SAOTCC_OTC", code);
  //   await page.click("#idSubmit_SAOTCC_Continue");
  // } else if (content3.includes("Approve sign in request")) {
  // }
  // await page.waitForNavigation();
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  // await page.click("#idSIButton9");

  await new Promise((resolve) => setTimeout(resolve, 30000));
  await browser.close();
})();
