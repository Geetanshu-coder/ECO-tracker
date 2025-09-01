//entities -> ward
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
