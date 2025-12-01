# Generated migration to remove causes and duration fields

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('animal', '0005_alter_animaldetection_prevention_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='animaldetection',
            name='causes',
        ),
        migrations.RemoveField(
            model_name='animaldetection',
            name='duration',
        ),
    ]

