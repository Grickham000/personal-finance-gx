import azure.functions as func
import logging
import json
from BL.user_profile_service import UserProfileService
from Common.Models.user_profile_api_model import UserProfileApiModel
from API.user_profile_dto import UserProfileDTO

user_profile_service = UserProfileService()

def create_user_profile(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing create user profile request.')
    user_id = user_profile_service.verify_token(req)
    if not user_id:
        return func.HttpResponse("Unauthorized", status_code=401)

    try:
        req_body = req.get_json()
        api_model = UserProfileApiModel.from_dict(req_body)
        
        dto = UserProfileDTO(
            user_id=user_id,
            user_name=api_model.user_name,
            expense_types=api_model.expense_types,
            payment_methods=api_model.payment_methods,
            monthly_income=api_model.monthly_income
        )
        
        profile_id = user_profile_service.create_profile(dto)
        return func.HttpResponse(json.dumps({'id': profile_id}), status_code=201, mimetype="application/json")
    except ValueError as ve:
        return func.HttpResponse(str(ve), status_code=400)
    except Exception as e:
        logging.error(f"Error creating profile: {str(e)}")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)

def get_user_profile(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing get user profile request.')
    user_id = user_profile_service.verify_token(req)
    if not user_id:
        return func.HttpResponse("Unauthorized", status_code=401)

    try:
        profile_dto = user_profile_service.get_profile(user_id)
        if profile_dto:
            return func.HttpResponse(json.dumps(profile_dto.to_dict()), status_code=200, mimetype="application/json")
        else:
            return func.HttpResponse("Profile not found", status_code=404)
    except Exception as e:
        logging.error(f"Error retrieving profile: {str(e)}")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)

def update_user_profile(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing update user profile request.')
    user_id = user_profile_service.verify_token(req)
    if not user_id:
        return func.HttpResponse("Unauthorized", status_code=401)

    id = req.route_params.get('id')
    if not id:
        return func.HttpResponse("Profile ID is required", status_code=400)

    try:
        req_body = req.get_json()
        api_model = UserProfileApiModel.from_dict(req_body)
        
        dto = UserProfileDTO(
            id=id,
            user_id=user_id,
            user_name=api_model.user_name,
            expense_types=api_model.expense_types,
            payment_methods=api_model.payment_methods,
            monthly_income=api_model.monthly_income
        )
        
        user_profile_service.update_profile(dto, id)
        return func.HttpResponse("Profile updated successfully", status_code=200)
    except PermissionError as pe:
        return func.HttpResponse(str(pe), status_code=403)
    except ValueError as ve:
        return func.HttpResponse(str(ve), status_code=404)
    except Exception as e:
        logging.error(f"Error updating profile: {str(e)}")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)

def delete_user_profile(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing delete user profile request.')
    user_id = user_profile_service.verify_token(req)
    if not user_id:
        return func.HttpResponse("Unauthorized", status_code=401)

    id = req.route_params.get('id')
    if not id:
        return func.HttpResponse("Profile ID is required", status_code=400)

    try:
        user_profile_service.delete_profile(user_id, id)
        return func.HttpResponse("Profile deleted successfully", status_code=200)
    except PermissionError as pe:
        return func.HttpResponse(str(pe), status_code=403)
    except ValueError as ve:
        return func.HttpResponse(str(ve), status_code=404)
    except Exception as e:
        logging.error(f"Error deleting profile: {str(e)}")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)
