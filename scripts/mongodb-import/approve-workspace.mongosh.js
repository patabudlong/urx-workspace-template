/**
 * Approve a pending workspace directly in MongoDB (when the admin UI is unavailable).
 *
 * Usage (replace IDs and run against your Coolify MongoDB):
 *   mongosh "$MONGODB_URI" --file scripts/mongodb-import/approve-workspace.mongosh.js
 *
 * Before running:
 *   1. Import superadmin-user.json into the `users` collection (or use an existing admin user id).
 *   2. Set WORKSPACE_ID to the pending workspace _id from the `workspaces` collection.
 */

const WORKSPACE_ID = 'REPLACE_WITH_PENDING_WORKSPACE_ID';
const REVIEWED_BY_USER_ID = '674a00000000000000000001'; // superadmin from superadmin-user.json

const workspaceObjectId = ObjectId(WORKSPACE_ID);
const reviewedByObjectId = ObjectId(REVIEWED_BY_USER_ID);
const now = new Date();

const workspace = db.workspaces.findOne({
	_id: workspaceObjectId,
	status: 'pending_review'
});

if (!workspace) {
	print('No pending workspace found with that id. Check WORKSPACE_ID and status.');
	quit(1);
}

const updateResult = db.workspaces.updateOne(
	{ _id: workspaceObjectId, status: 'pending_review' },
	{
		$set: {
			status: 'active',
			reviewedAt: now,
			reviewedByUserId: reviewedByObjectId,
			updatedAt: now
		}
	}
);

if (updateResult.modifiedCount !== 1) {
	print('Workspace was not updated.');
	quit(1);
}

const existingMember = db.workspace_members.findOne({
	userId: workspace.requestedByUserId,
	workspaceId: workspaceObjectId
});

if (!existingMember) {
	db.workspace_members.insertOne({
		_id: new ObjectId(),
		userId: workspace.requestedByUserId,
		workspaceId: workspaceObjectId,
		role: 'owner',
		joinedAt: now,
		createdAt: now,
		updatedAt: now
	});
	print('Created workspace owner membership.');
} else {
	print('Workspace owner membership already exists; skipped insert.');
}

print(`Approved workspace "${workspace.name}" (${workspace.slug}).`);
