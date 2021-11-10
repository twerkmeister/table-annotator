#!/bin/bash

if [ -z "$1" ]
  then
    echo "Tesserotate adjusts images if tesseract orientation detection finds them"
    echo "to be rotated at -90°"
    echo "Usage: $0 <image to potentially rotate>"
    exit 1
fi

tesseract -l deu --psm 0 "$1" - | grep "Rotate: 90" && convert "$1" -rotate 90 "$1"