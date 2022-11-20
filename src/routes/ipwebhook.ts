import { networkInterfaces } from "os";
import SGMailService from "@sendgrid/mail";
import { isEmpty } from "../helpers/utils";
import { RouteConfig } from "../types";

const sendLocalIPToEmail: RouteConfig["callbacks"] = (req, res) => {
  if (!process.env.IP_REQUEST_KEY) {
    res.status(500).json({ message: "😝" });
    return;
  }
  if (
    req.headers.authorization &&
    req.headers.authorization === process.env.IP_REQUEST_KEY
  ) {
    if (process.env.SENDGRID_API_KEY) {
      SGMailService.setApiKey(process.env.SENDGRID_API_KEY);
    }

    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
      const networksInType = nets[name];
      if (networksInType)
        for (const net of networksInType) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
          const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
          if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
              results[name] = [];
            }
            results[name].push(net.address);
          }
        }
      if (!isEmpty(results)) {
        const msg = {
          to: "aniruddharao741@gmail.com", // Change to your recipient
          from: "aniganesh741@gmail.com", // Change to your verified sender
          subject: `New ip ${new Date()}`,
          text: `Local ips: ${JSON.stringify(results)}`,
          html: `<p>Local ips: <br /> <strong>${JSON.stringify(
            results
          )}</strong> </p>`,
        };
        SGMailService.send(msg)
          .then(() => {
            console.log("Email sent");
            res.status(200).json({ status: "success" });
          })
          .catch((error) => {
            res
              .status(500)
              .json({
                status: "Failure. Something failed in the mail service",
              });
            console.error({
              error,
              response: error.response,
              bodyErrors: error.response.body.errors,
            });
          });
      }
    }
    return;
  } else {
    res.status(403).json({ message: "Poda panni" });
  }
};

const ipWebHook: RouteConfig = {
  callbacks: [sendLocalIPToEmail],
  method: "post",
  route: "/send-local-ip",
};

export default [ipWebHook];
