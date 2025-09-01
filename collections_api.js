// JavaScript Example: Reading Entities
// Filterable fields: household_qr, collector_name, status, collection_time, ward_number, notes, points_awarded
async function fetchCollectionEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/68b47ed192136284856b909c/entities/Collection`, {
        headers: {
            'api_key': '1310e7d8b6594f9daa47685c0b92e6d0', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: household_qr, collector_name, status, collection_time, ward_number, notes, points_awarded
async function updateCollectionEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/68b47ed192136284856b909c/entities/Collection/${entityId}`, {
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
