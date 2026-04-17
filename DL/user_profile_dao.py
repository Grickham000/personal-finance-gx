from firebase_admin import firestore
from DL.user_profile_entity import UserProfileEntity
import logging

class UserProfileDAO:
    def __init__(self):
        self.db = firestore.client()

    def create_profile(self, profile_entity: UserProfileEntity) -> str:
        # Check if profile already exists for this user
        existing = self.db.collection('user_profile').where('user_id', '==', profile_entity.user_id).limit(1).get()
        if existing:
            raise ValueError("Profile already exists for this user.")
        
        profile_ref = self.db.collection('user_profile').add(profile_entity.to_dict())
        return profile_ref[1].id

    def get_profile(self, user_id: str) -> UserProfileEntity:
        logging.info(f"Retrieving profile for user_id: {user_id}")
        
        profiles = self.db.collection('user_profile').where('user_id', '==', user_id).limit(1).get()
        if profiles:
            profile_dict = profiles[0].to_dict()
            doc_id = profiles[0].id
            return UserProfileEntity.from_dict(profile_dict, id=doc_id)
        return None

    def update_profile(self, profile_entity: UserProfileEntity, id: str):
        profile_ref = self.db.collection('user_profile').document(id)
        profile = profile_ref.get()

        if profile.exists:
            profile_data = profile.to_dict()
            if profile_data.get('user_id') == profile_entity.user_id:
                profile_ref.update(profile_entity.to_dict())
                logging.info(f"Profile with ID {id} for user_id {profile_entity.user_id} successfully updated.")
                return True
            else:
                logging.warning(f"Attempt to update profile with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to update this profile.")
        else:
            logging.warning(f"Profile with ID {id} does not exist.")
            raise ValueError(f"Profile with ID {id} does not exist.")

    def delete_profile(self, user_id: str, id: str):
        profile_ref = self.db.collection('user_profile').document(id)
        profile = profile_ref.get()
        
        if profile.exists:
            profile_data = profile.to_dict()
            if profile_data.get('user_id') == user_id:
                profile_ref.delete()
                logging.info(f"Profile with ID {id} for user_id {user_id} successfully deleted.")
                return True
            else:
                logging.warning(f"Attempt to delete profile with ID {id} denied due to user_id mismatch.")
                raise PermissionError("You do not have permission to delete this profile.")
        else:
            logging.warning(f"Profile with ID {id} does not exist.")
            raise ValueError(f"Profile with ID {id} does not exist.")
