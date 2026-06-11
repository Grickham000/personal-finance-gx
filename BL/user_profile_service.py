from firebase_admin import auth
import logging
from DL.user_profile_dao import UserProfileDAO
from DL.user_profile_toa import UserProfileTOA
from API.user_profile_dto import UserProfileDTO

class UserProfileService:
    def __init__(self):
        self.user_profile_dao = UserProfileDAO()
        self.user_profile_toa = UserProfileTOA()

    def verify_token(self, req):
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        id_token = auth_header.split(' ')[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            if not decoded_token.get('email_verified'):
                logging.warning("User email is not verified.")
                return None
            return decoded_token['uid']
        except Exception as e:
            logging.error(f"Error verifying token: {e}")
            return None

    def create_profile(self, dto: UserProfileDTO) -> str:
        entity = self.user_profile_toa.dto_to_entity(dto)
        return self.user_profile_dao.create_profile(entity)

    def get_profile(self, user_id: str) -> UserProfileDTO:
        entity = self.user_profile_dao.get_profile(user_id)
        if entity:
            return self.user_profile_toa.entity_to_dto(entity)
        return None

    def update_profile(self, dto: UserProfileDTO, id: str):
        existing_entity = self.user_profile_dao.get_profile(dto.user_id)
        if existing_entity:
            existing_pm_ids = {
                pm.get('name', '').lower(): pm.get('id')
                for pm in (existing_entity.payment_methods or [])
                if pm.get('id')
            }
            for pm in (dto.payment_methods or []):
                name_lower = pm.get('name', '').lower()
                if name_lower in existing_pm_ids:
                    pm['id'] = existing_pm_ids[name_lower]
        entity = self.user_profile_toa.dto_to_entity(dto)
        return self.user_profile_dao.update_profile(entity, id)

    def delete_profile(self, user_id: str, id: str):
        return self.user_profile_dao.delete_profile(user_id, id)
