const delimeter = "_";

function getRoomNameFromContext(context: string, entityId: string) {
    return `${context}${delimeter}${entityId}${delimeter}room`;
}

function getRoomNameFromContextAndRole(context: string, role: string, entityId: string) {
    return `${context}${delimeter}role${delimeter}base${delimeter}${entityId}${delimeter}${role}${delimeter}room`;
}

function getDishaSessionRoomName(sessionId: string) {
    return `disha${delimeter}session${delimeter}${sessionId}${delimeter}room`;
}

// battleground_mongoId_room

export { getRoomNameFromContext, getRoomNameFromContextAndRole, getDishaSessionRoomName };
