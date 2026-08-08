import { useContext, useEffect } from "react"
import { ProfileContext } from "../profile.context"
import { getProfileAPI, updateProfileSectionAPI, uploadProfilePictureAPI, uploadDocumentAPI, deleteDocumentAPI } from "../services/profile.api"

export const useProfile = () => {
    const context = useContext(ProfileContext)

    if (!context) {
        throw new Error("useProfile must be used within a ProfileProvider")
    }

    const { loading, setLoading, profile, setProfile } = context

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const response = await getProfileAPI()
            if (response && response.profile) {
                setProfile(response.profile)
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
        } finally {
            setLoading(false)
        }
    }

    const updateSection = async (section, data) => {
        setLoading(true)
        try {
            const response = await updateProfileSectionAPI(section, data)
            if (response && response.profile) {
                setProfile(response.profile)
                return { success: true }
            }
        } catch (error) {
            console.error(`Error updating ${section}:`, error)
            return { success: false, error: error.response?.data?.message || "Failed to update" }
        } finally {
            setLoading(false)
        }
    }

    const updatePicture = async (base64Image) => {
        setLoading(true)
        try {
            const response = await uploadProfilePictureAPI(base64Image)
            if (response && response.profile) {
                setProfile(response.profile)
                return { success: true }
            }
        } catch (error) {
            console.error("Error updating picture:", error)
            return { success: false, error: "Failed to upload picture" }
        } finally {
            setLoading(false)
        }
    }

    const uploadDocument = async (docData) => {
        setLoading(true)
        try {
            const response = await uploadDocumentAPI(docData)
            if (response && response.profile) {
                setProfile(response.profile)
                return { success: true }
            }
        } catch (error) {
            console.error("Error uploading document:", error)
            return { success: false, error: error.response?.data?.message || "Upload failed" }
        } finally {
            setLoading(false)
        }
    }

    const deleteDocument = async (docId) => {
        setLoading(true)
        try {
            const response = await deleteDocumentAPI(docId)
            if (response && response.profile) {
                setProfile(response.profile)
                return { success: true }
            }
        } catch (error) {
            console.error("Error deleting document:", error)
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    return { 
        loading, 
        profile, 
        fetchProfile, 
        updateSection, 
        updatePicture, 
        uploadDocument, 
        deleteDocument 
    }
}
