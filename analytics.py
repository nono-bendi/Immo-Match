from posthog import Posthog

_client = Posthog(
    project_api_key='phc_yFKU2CNX4miygcMq3CXi3ebCdALEZX8qxZ6DPnbkCqgC',
    host='https://us.i.posthog.com',
)

def track(user_id, event: str, properties: dict = None):
    _client.capture(str(user_id), event, properties or {})
