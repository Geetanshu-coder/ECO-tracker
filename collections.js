//entities -> collections
{
  "name": "Collection",
  "type": "object",
  "properties": {
    "household_qr": {
      "type": "string",
      "description": "QR code of the household"
    },
    "collector_name": {
      "type": "string",
      "description": "Name of the waste collector"
    },
    "status": {
      "type": "string",
      "enum": [
        "segregated",
        "mixed"
      ],
      "description": "Waste segregation status"
    },
    "collection_time": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp of collection"
    },
    "ward_number": {
      "type": "string",
      "description": "Ward where collection happened"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes from collector"
    },
    "points_awarded": {
      "type": "number",
      "default": 0,
      "description": "Points awarded for this collection"
    }
  },
  "required": [
    "household_qr",
    "collector_name",
    "status",
    "ward_number"
  ]
}
