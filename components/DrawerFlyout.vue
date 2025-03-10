<script setup lang="ts">
import { ref, type VNodeRef } from "vue";
import {
  Dialog,
  DialogOverlay,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import XIcon from "@/components/icons/XmarkIcon.vue";
import { useDisplay } from "vuetify";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  openFromLeft: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["closePreview"]);

const cancelButtonRef = ref<VNodeRef | null>(null);
const { smAndDown } = useDisplay();

function closePreview() {
  emit("closePreview");
}
</script>

<template>
  <client-only>
  <TransitionRoot as="template" :show="props.isOpen">
    <Dialog
      as="div"
      class="fixed inset-y-0 overflow-hidden z-20"
      :class="props.openFromLeft ? 'left-0' : 'right-0'"
      :initial-focus="cancelButtonRef"
      @close="closePreview"
    >
      <div class="absolute inset-0 overflow-hidden">
        <DialogOverlay
          class="absolute inset-y-0 bg-gray-900 bg-opacity-50"
          :class="props.openFromLeft ? 'right-0' : 'left-0'"
        />
        <div
          class="fixed inset-y-0 max-w-full flex"
          :class="props.openFromLeft ? 'left-0 pr-10' : 'right-0 pl-10'"
        >
          <TransitionChild
            as="template"
            enter="transform transition ease-in-out duration-100 sm:duration-100"
            :enter-from="props.openFromLeft ? '-translate-x-full' : 'translate-x-full'"
            enter-to="translate-x-0"
            leave="transform transition ease-in-out duration-100 sm:duration-100"
            leave-from="translate-x-0"
            :leave-to="props.openFromLeft ? '-translate-x-full' : 'translate-x-full'"
          >
            <DialogPanel class="pointer-events-auto w-screen max-w-lg">
              <div class="h-full divide-y divide-gray-200 flex flex-col shadow-xl bg-white dark:bg-gray-900 dark:text-white">
                <div class="min-h-0 flex-1 flex flex-col py-6 overflow-y-scroll">
                  <div>
                    <div class="flex items-start justify-between">
                      <div class="h-7 flex items-center">
                        <button
                          :ref="cancelButtonRef"
                          type="button"
                          :class="smAndDown ? 'ml-2' : 'ml-4'"
                          class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          @click="closePreview"
                        >
                          <span data-testid="close-drawer-top-button" class="sr-only">
                            Close panel
                          </span>
                          <XIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                        <h1 class="text-lg mt-2 mx-2">{{ props.title }}</h1>
                      </div>
                    </div>
                  </div>
                  <div class="relative flex-1" :class="[smAndDown ? 'm-2' : 'm-4']">
                    <slot />
                  </div>
                </div>
                <div class="flex-shrink-0 px-4 py-4 flex justify-end">
                  <button
                    type="button"
                    data-testid="close-drawer-bottom-button"
                    class="py-2 px-4 border border-gray-300 dark:bg-gray-700 dark:border-gray-700 dark:text-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    @click="closePreview"
                  >
                    Close
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</client-only>
</template>
