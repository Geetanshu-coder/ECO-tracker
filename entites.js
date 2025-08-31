//Entities -> HouseHold

{
  "name": "Household",
  "type": "object",
  "properties": {
    "qr_code": {
      "type": "string",
      "description": "Unique QR code identifier for the household"
    },
    "address": {
      "type": "string",
      "description": "Complete address of the household"
    },
    "ward_number": {
      "type": "string",
      "description": "Ward or area number"
    },
    "ward_name": {
      "type": "string",
      "description": "Ward or area name"
    },
    "resident_name": {
      "type": "string",
      "description": "Primary resident contact name"
    },
    "phone_number": {
      "type": "string",
      "description": "Contact phone number"
    },
    "total_points": {
      "type": "number",
      "default": 0,
      "description": "Total reward points earned"
    },
    "compliance_rate": {
      "type": "number",
      "default": 0,
      "description": "Percentage of proper waste segregation"
    }
  },
  "required": [
    "qr_code",
    "address",
    "ward_number",
    "ward_name"
  ]
}

//Entities -> collection

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

//Entities -> Ward

{
  "name": "Ward",
  "type": "object",
  "properties": {
    "ward_number": {
      "type": "string",
      "description": "Ward number or identifier"
    },
    "ward_name": {
      "type": "string",
      "description": "Ward name"
    },
    "total_households": {
      "type": "number",
      "description": "Total number of registered households"
    },
    "supervisor_name": {
      "type": "string",
      "description": "Ward supervisor name"
    },
    "supervisor_contact": {
      "type": "string",
      "description": "Supervisor contact details"
    }
  },
  "required": [
    "ward_number",
    "ward_name"
  ]
}
