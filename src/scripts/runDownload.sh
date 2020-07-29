#!/bin/sh

assets="$1"

if [ ! -f "exports/config.json" ]; then
  echo "Set up /exports/config.json before continuing ..."
  echo "yarn program --contentful_setup"
  echo ""
  exit 0
fi

echo "Setting up export..."
echo ""

if [  -f "exports/config.json" ]; then
  echo "Downloading content from contentful..."
  echo "==============================================="

  if yarn export --config exports/config.json --skip-webhooks --skip-roles --content-file contentful_export.json --export-dir exports/; then
    echo ""
    echo "Download content complete..."
    echo "==============================================="
  else
    echo ""
    echo "==============================================="
    echo "Check exports/config.json for valid tokens before continuing ..."
    echo "Run --contentful_setup again ..."
    echo "==============================================="
  fi

  echo "Downloading assets from contentful..."
  echo "==============================================="

  mkdir -p exports/assets

  if ( yarn export --content-only --save-file false --download-assets --skip-webhooks --skip-roles --config exports/config.json --export-dir exports/assets );
  then
    echo ""
    echo "Download assets complete..."
    echo "==============================================="
  else
    echo ""
    echo "==============================================="
    echo "Check exports/config.json for valid tokens before continuing ..."
    echo "Run --contentful_setup again ..."
    echo "==============================================="
  fi
fi







