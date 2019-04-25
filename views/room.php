<html>

<head>
    <script src="http://webrtc.github.io/adapter/adapter-latest.js"></script>
    <script>var room = "<?php echo $room ?>";</script>

</head>

<body>

<video id="localVideo" autoplay muted width="50" height="auto"></video>
<video id="remoteVideo" autoplay></video>

<input type="text" id="chat"/>
<button type="button" id="send" >Send</button>

</body>

<script src="/main.js"></script>

</html>