const router = require("express").Router();
const {MessageType } = require("@adiwajshing/baileys");

router.post("/sendmessage/:phone", async (req, res) => {
  let phone = req.params.phone;
  let message = req.body.message;

  if (phone == undefined || message == undefined) {
    res.send({
      status: "error",
      message: `Please enter valid phone and message`,
    });
  } else {
    await client
      .sendMessage(phone + "@c.us", message, MessageType.text)
      .then((response) => {
        if (response.key.fromMe) {
          res.send({
            status: "success",
            message: `MessageType.text successfully sent to ${phone}`,
          });
        }
      });
  }
});

module.exports = router;
