from copy import deepcopy


def merge_settings(defaults, overrides):
    """Return a deep merge of JSON-style settings without sharing mutables."""
    merged = deepcopy(defaults)

    for key, override_value in overrides.items():
        default_value = merged.get(key)
        if isinstance(default_value, dict) and isinstance(override_value, dict):
            merged[key] = merge_settings(default_value, override_value)
        else:
            merged[key] = deepcopy(override_value)

    return merged
