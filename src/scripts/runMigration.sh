#!/bin/sh

mkdir -p "mappedExports/"

yarn map_language

yarn map_asset

yarn migrate_language

yarn migrate_assets

yarn map_content

yarn migrate_types

yarn migrate_entries

yarn publish_entries






