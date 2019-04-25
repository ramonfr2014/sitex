<?php

$request = $_SERVER["REQUEST_URI"];

switch ($request) {
  case '/' :
    require '../views/index.php';
    break;
  default:
    $room = str_replace('/', '', $request);
    require '../views/room.php';
    break;
}
