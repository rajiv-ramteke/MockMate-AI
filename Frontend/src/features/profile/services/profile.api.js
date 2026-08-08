import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.DEV ? "http://localhost:3000" : "",
    withCredentials: true,
})

export const getProfileAPI = async () => {
    const response = await api.get("/api/profile/");
    return response.data;
}

export const updateProfileSectionAPI = async (section, data) => {
    const response = await api.put(`/api/profile/${section}`, data);
    return response.data;
}

export const uploadProfilePictureAPI = async (base64Image) => {
    const response = await api.put("/api/profile/picture", { base64Image });
    return response.data;
}

export const uploadDocumentAPI = async (docData) => {
    const response = await api.post("/api/profile/documents", docData);
    return response.data;
}

export const deleteDocumentAPI = async (docId) => {
    const response = await api.delete(`/api/profile/documents/${docId}`);
    return response.data;
}
