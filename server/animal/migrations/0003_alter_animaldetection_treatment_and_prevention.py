# Generated manually to fix field types
from django.db import migrations, models
from django.db import connection


def fix_invalid_json_data_forward(apps, schema_editor):
    """Fix invalid JSON data before converting fields from TextField to JSONField"""
    # Use raw SQL to fix invalid JSON values directly in database
    with connection.cursor() as cursor:
        # Fix treatment field - replace "Invalid value." and other invalid values with empty JSON array
        cursor.execute("""
            UPDATE animal_animaldetection 
            SET treatment = '[]' 
            WHERE treatment IS NULL 
               OR treatment = '' 
               OR treatment = 'Invalid value.'
               OR (treatment NOT LIKE '[%' AND treatment NOT LIKE '{%');
        """)
        
        # Fix prevention field - replace "Invalid value." and other invalid values with empty JSON array
        cursor.execute("""
            UPDATE animal_animaldetection 
            SET prevention = '[]' 
            WHERE prevention IS NULL 
               OR prevention = '' 
               OR prevention = 'Invalid value.'
               OR (prevention NOT LIKE '[%' AND prevention NOT LIKE '{%');
        """)


def fix_invalid_json_data_reverse(apps, schema_editor):
    """Reverse migration - nothing needed"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0002_alter_animaldetection_options_and_more'),
    ]

    operations = [
        # First, fix invalid JSON data using RunPython with raw SQL
        migrations.RunPython(
            fix_invalid_json_data_forward,
            fix_invalid_json_data_reverse,
            atomic=False  # Use atomic=False to allow partial completion if needed
        ),
        # Then, change field types from TextField to JSONField
        migrations.AlterField(
            model_name='animaldetection',
            name='treatment',
            field=models.JSONField(default=list, blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='animaldetection',
            name='prevention',
            field=models.JSONField(default=list, blank=True, null=True),
        ),
    ]
