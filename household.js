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
