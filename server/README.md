# RepairTrack Backend Service

This is the Node.js / Express backend for the RepairTrack SaaS application. 

## Super Admin Management

To manage tenants (shop owners) since public registration is disabled, you must use the included utility script to create them directly in the database.

### Create a Shop
Run the following script from the `server` directory:

```bash
node create_shop.js <shopName> <ownerName> <email> <password> [trialDays]
```

**Example:**
```bash
node create_shop.js "Dave's Phones" "Dave" "[EMAIL_ADDRESS]" "securePass123" 14
```

This will automatically create the shop and link an active `starter` subscription with a `trial` status for the specified number of days (default 7).
