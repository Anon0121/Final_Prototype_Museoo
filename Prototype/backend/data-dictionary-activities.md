# Data Dictionary - Activities Table

## Table: activities

| Field Name | Type.Size | Value | Description |
|------------|-----------|-------|-------------|
| id | int(11) | auto_increment | A unique identifier for each activity. It serves as the primary key for the table and is automatically assigned. This field cannot be null. |
| title | varchar(255) | NULL | The title or name of the activity. It's a string field with a maximum length of 255 characters and cannot be null. |
| description | text | NULL | A detailed description of the activity. This is a text field that can store longer strings and is nullable. |
| type | enum('event','exhibit') | event or exhibit | Specifies the category of the activity, which can either be an 'event' or an 'exhibit'. This field cannot be null. |
| created_at | timestamp | current_timestamp() | The timestamp indicating when the activity record was created. It automatically defaults to the current time and cannot be null. |
| max_capacity | int(11) | 50 | The maximum number of participants or attendees allowed for the activity. It's an integer field with a default value of 50 and is nullable. |
| current_registrations | int(11) | 0 | The current number of people registered for the activity. It's an integer field with a default value of 0 and is nullable. |

## Notes
- The `id` field is the primary key and auto-increments
- The `type` field is restricted to only 'event' or 'exhibit' values
- The `created_at` field automatically sets to the current timestamp when a record is created
- Both `max_capacity` and `current_registrations` have default values but can be null


