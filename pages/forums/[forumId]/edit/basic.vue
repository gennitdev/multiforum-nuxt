<script setup lang="ts">
import {
  MAX_CHARS_IN_CHANNEL_DESCRIPTION,
  MAX_CHARS_IN_CHANNEL_DISPLAY_NAME,
} from "@/utils/constants";
import TagPicker from "@/components/TagPicker.vue";
import TextInput from "@/components/TextInput.vue";
import TextEditor from "@/components/TextEditor.vue";
import AddImage from "@/components/AddImage.vue";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
import { usernameVar } from "@/cache";
import { ref, nextTick, defineProps, defineEmits } from "vue";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { useMutation } from "@vue/apollo-composable";

defineProps({
  formValues: {
    type: Object,
    required: true,
  },
  touched: {
    type: Boolean,
    required: true,
  },
  titleIsInvalid: {
    type: Boolean,
    required: true,
  },
  editMode: {
    type: Boolean,
    required: true,
  },
});
type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event;
  fieldName: string;
};

const titleInputRef = ref(null);

nextTick(() => {
  if (titleInputRef.value) {
    // @ts-ignore - titleInputRef is not null
    titleInputRef.value?.focus();
  }
});

const emit = defineEmits(["updateFormValues", "submit"]);

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error("No username found");
    return;
  }

  try {
    const filename = getUploadFileName({
      username: usernameVar.value,
      file,
    });

    const getSignedStorageURLInput = {
      filename,
      contentType: file.type,
    };

    const signedUrlResult = await createSignedStorageUrl(
      getSignedStorageURLInput
    );
    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    const embeddedLink = uploadAndGetEmbeddedLink({
      file,
      filename,
      signedStorageURL,
      fileType: file.type,
    });

    return embeddedLink;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

const handleImageChange = async (input: FileChangeInput) => {
  const { event, fieldName } = input;
  const selectedFile = (event.target as HTMLInputElement).files?.[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);
    if (!embeddedLink) return;

    emit("updateFormValues", { [fieldName]: embeddedLink });
    emit("submit");
  }
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5 flex-1">
    <FormRow section-title="Forum Unique Name" :required="!editMode">
      <template #content>
        <TextInput
          ref="titleInputRef"
          :test-id="'title-input'"
          :disabled="true"
          :value="formValues.uniqueName"
          :placeholder="'Add unique name with no spaces. Ex. forum_name'"
          :full-width="true"
        />
      </template>
    </FormRow>

    <FormRow section-title="Forum Display Name">
      <template #content>
        <TextInput
          ref="displayNameInputRef"
          :test-id="'display-name-input'"
          :value="formValues.displayName"
          :placeholder="'A more human readable display name'"
          :full-width="true"
          @update="$emit('updateFormValues', { displayName: $event })"
        />
        <CharCounter
          :current="formValues.displayName?.length || 0"
          :max="MAX_CHARS_IN_CHANNEL_DISPLAY_NAME"
        />
      </template>
    </FormRow>

    <FormRow section-title="Tags">
      <template #content>
        <TagPicker
          data-testid="tag-input"
          :selected-tags="formValues.selectedTags"
          @set-selected-tags="
            $emit('updateFormValues', { selectedTags: $event })
          "
        />
      </template>
    </FormRow>

    <FormRow section-title="Description">
      <template #content>
        <TextEditor
          class="my-3"
          :test-id="'description-input'"
          :initial-value="formValues.description || ''"
          :placeholder="'Add description'"
          :disable-auto-focus="true"
          :allow-image-upload="false"
          @update="$emit('updateFormValues', { description: $event })"
        />
        <CharCounter
          :current="formValues.description?.length || 0"
          :max="MAX_CHARS_IN_CHANNEL_DESCRIPTION"
        />
      </template>
    </FormRow>
    <FormRow section-title="Forum Icon">
      <template #content>
        <AvatarComponent
          class="shadow-sm"
          :src="formValues.channelIconURL"
          :text="formValues.uniqueName"
          :is-square="true"
          :is-medium="true"
        />
        <AddImage
          key="channel-icon-url"
          :field-name="'channelIconURL'"
          @file-change="
            (input: FileChangeInput) => {
              handleImageChange(input);
            }
          "
        />
      </template>
    </FormRow>
    <FormRow section-title="Forum Banner">
      <template #content>
        <img
          v-if="formValues.channelBannerURL"
          class="w-full shadow-sm"
          :src="formValues.channelBannerURL"
          :alt="formValues.uniqueName"
        >
        <AddImage
          key="channel-banner-url"
          :field-name="'channelBannerURL'"
          @file-change="
            (input: FileChangeInput) => {
              handleImageChange(input);
            }
          "
        />
      </template>
    </FormRow>
    <FormRow section-title="Destructive Settings" :dangerous="true">
      <template #content>
        <div class="flex gap-2 align-items mt-4">
          <CheckBox
            :test-id="'lock-forum-checkbox'"
            :checked="formValues.locked"
            @update="$emit('updateFormValues', { locked: $event })"
          />
          <label
            class="text-sm text-gray-600 dark:text-gray-400"
            for="lock-forum-checkbox"
            >Lock Forum</label
          >
        
        </div>
        <p
          class="text-sm text-gray-600 dark:text-gray-400 mt-2"
        >
          Locking a forum will prevent users from creating new threads or
          replying to existing threads.
        </p>
      </template>
    </FormRow>
  </div>
</template>
