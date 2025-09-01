// JavaScript Example: Reading Entities
// Filterable fields: ward_number, ward_name, total_households, supervisor_name, supervisor_contact
async function fetchWardEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/68b47ed192136284856b909c/entities/Ward`, {
        headers: {
            'api_key': '1310e7d8b6594f9daa47685c0b92e6d0', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: ward_number, ward_name, total_households, supervisor_name, supervisor_contact
async function updateWardEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/68b47ed192136284856b909c/entities/Ward/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '1310e7d8b6594f9daa47685c0b92e6d0', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}
