# Generated migration to remove causes and duration fields
# Note: These fields were never actually added (migration 0004 was a no-op)
# So this migration is also a no-op to maintain migration history consistency

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0005_alter_animaldetection_prevention_and_more'),
    ]

    operations = [
        # No operations needed - causes and duration fields were never added
        # Migration 0004 was a no-op, so these fields don't exist to remove
    ]

