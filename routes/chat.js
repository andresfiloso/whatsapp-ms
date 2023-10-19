const router = require('express').Router();

router.post('/sendmessage/:phone', async (req, res) => {
  let phone = req.params.phone;
  let message = req.body.message;

  if (phone == undefined || message == undefined) {
    res.send({
      status: 'error',
      message: `Please enter valid phone and message`,
    });
  } else {
    const result = await client.sendMessage(`${phone}@c.us`, message);
    console.log('result', result);
    res.send({
      status: 'success',
      message: `MessageType.text successfully sent to ${phone}`,
    });
  }
});

module.exports = router;
