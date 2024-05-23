import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import SentenceImporter from '@/components/SentenceImporter.vue'

describe('SetenceImporter', () => {
  it('renders properly', () => {
    const wrapper = mount(SentenceImporter)
    expect(wrapper.text()).toContain('Upload File')
  })
})
