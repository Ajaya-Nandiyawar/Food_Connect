import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.applications import MobileNetV2
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
from collections import Counter

# Set paths
base_dir = r"c:\Users\ASUS\Documents\GitHub\Python_CP\Food_Connect-backend\ASEP\auth\spoilage_predictor\Dataset"
img_height, img_width = 224, 224
batch_size = 16
epochs = 20

# Check class distribution
def check_class_distribution(directory):
    class_counts = Counter()
    for subdir in os.listdir(directory):
        subdir_path = os.path.join(directory, subdir)
        if os.path.isdir(subdir_path):
            class_counts[subdir] = len(os.listdir(subdir_path))
    print("Class distribution:", class_counts)
    return class_counts

check_class_distribution(base_dir)

# Clean broken images
def is_image_valid(filepath):
    try:
        with open(filepath, "rb") as f:
            f.read()
        return True
    except Exception:
        return False

def clean_broken_images(folder_path):
    for subdir, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                file_path = os.path.join(subdir, file)
                if not is_image_valid(file_path):
                    print(f"Removing broken image: {file_path}")
                    if os.path.exists(file_path):
                        os.remove(file_path)

clean_broken_images(base_dir)

# Data generators
train_datagen = ImageDataGenerator(
    rescale=1.0/255,
    validation_split=0.2,
    rotation_range=40,
    width_shift_range=0.3,
    height_shift_range=0.3,
    shear_range=0.3,
    zoom_range=[0.7, 1.3],
    horizontal_flip=True,
    vertical_flip=True,
    brightness_range=[0.6, 1.4],
    channel_shift_range=20.0,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1.0/255, validation_split=0.2)

train_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(img_height, img_width),
    batch_size=batch_size,
    class_mode='categorical',
    subset='training'
)

val_generator = val_datagen.flow_from_directory(
    base_dir,
    target_size=(img_height, img_width),
    batch_size=batch_size,
    class_mode='categorical',
    subset='validation'
)

# Compute class weights
classes = np.unique(train_generator.classes)
class_weights = compute_class_weight('balanced', classes=classes, y=train_generator.classes)
class_weight_dict = dict(zip(classes, class_weights))
print("Class weights:", class_weight_dict)

# Load MobileNetV2
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(img_height, img_width, 3))
base_model.trainable = False

# Build model
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.4),
    layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.01)),
    layers.Dropout(0.4),
    layers.Dense(train_generator.num_classes, activation='softmax')
])

# Compile
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Early stopping
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

# Train
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=epochs,
    steps_per_epoch=train_generator.samples // batch_size,
    class_weight=class_weight_dict,
    callbacks=[early_stop]
)

# Save model
model.save("spoilage_image_model.h5")

# Test on rotten image
from tensorflow.keras.preprocessing.image import load_img, img_to_array

test_image_path = "path_to_rotten_food_image.jpg"  # Replace with actual path
img = load_img(test_image_path, target_size=(img_height, img_width))
img_array = img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)
prediction = model.predict(img_array)
predicted_class = np.argmax(prediction, axis=1)
class_labels = train_generator.class_indices
print("Predicted class:", list(class_labels.keys())[predicted_class[0]])
print("Prediction probabilities:", prediction)